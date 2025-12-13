import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import * as db from '@/lib/db';

// GET /api/ledger?accountId=[id]&fromDate=[date]&toDate=[date]
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt((session.user as any).id);
    const { searchParams } = new URL(request.url);
    const accountIdParam = searchParams.get('accountId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    let accountId: number | undefined;

    if (accountIdParam && accountIdParam !== 'consolidated') {
      accountId = parseInt(accountIdParam);
      if (isNaN(accountId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid account ID' },
          { status: 400 }
        );
      }
      // Verify account belongs to user
      const account = await db.db.getAccountById(accountId, userId);
      if (!account) {
        return NextResponse.json(
          { success: false, error: 'Account not found' },
          { status: 404 }
        );
      }
    }

    // Build query - user-specific via account ownership
    let sql = `
      SELECT l.* FROM ledger l
      INNER JOIN accounts a ON l.account_id = a.id
      WHERE a.user_id = ?
    `;
    const params: any[] = [userId];

    if (accountId) {
      sql += ' AND l.account_id = ?';
      params.push(accountId);
    }

    if (fromDate) {
      sql += ' AND l.posting_date >= ?';
      params.push(fromDate);
    }

    if (toDate) {
      sql += ' AND l.posting_date <= ?';
      params.push(toDate);
    }

    sql += ' ORDER BY l.posting_date DESC';

    const ledgerEntries = await db.query(sql, params);

    // Get all accounts - user-specific
    const accounts = await db.db.getAccounts(userId);
    const accountMap = new Map(accounts.map(a => [a.id, a.name]));

    // Group by account
    const accountGroups = new Map<number, any>();

    for (const entry of ledgerEntries) {
      if (!accountGroups.has(entry.account_id)) {
        accountGroups.set(entry.account_id, {
          accountId: entry.account_id,
          accountName: accountMap.get(entry.account_id) || 'Unknown',
          totalDebit: 0,
          totalCredit: 0,
          netCashFlow: 0,
          categories: {
            feesAndCharges: { debit: 0, credit: 0 },      // Book Voucher
            fundsAdded: { debit: 0, credit: 0 },          // Bank Receipts
            internalAdjustment: { debit: 0, credit: 0 },  // Journal Entry
            fundsWithdrawn: { debit: 0, credit: 0 },      // Bank Payments
            dematMovement: { debit: 0, credit: 0 },       // Delivery Voucher
          },
          entries: [],
        });
      }

      const group = accountGroups.get(entry.account_id)!;
      group.entries.push(entry);

      const debit = parseFloat(entry.debit?.toString() || '0');
      const credit = parseFloat(entry.credit?.toString() || '0');

      group.totalDebit += debit;
      group.totalCredit += credit;

      // Categorize by voucher type - track debit and credit separately
      const voucherType = (entry.voucher_type || '').toLowerCase();

      if (voucherType.includes('book')) {
        group.categories.feesAndCharges.debit += debit;
        group.categories.feesAndCharges.credit += credit;
      } else if (voucherType.includes('bank receipt')) {
        group.categories.fundsAdded.debit += debit;
        group.categories.fundsAdded.credit += credit;
      } else if (voucherType.includes('journal')) {
        group.categories.internalAdjustment.debit += debit;
        group.categories.internalAdjustment.credit += credit;
      } else if (voucherType.includes('bank payment')) {
        group.categories.fundsWithdrawn.debit += debit;
        group.categories.fundsWithdrawn.credit += credit;
      } else if (voucherType.includes('delivery')) {
        group.categories.dematMovement.debit += debit;
        group.categories.dematMovement.credit += credit;
      }
    }

    // Calculate net cash flow and invested value for each account
    for (const group of accountGroups.values()) {
      group.netCashFlow = group.totalCredit - group.totalDebit;
      // Invested Value = Funds Added (Bank Receipts Debit) - Funds Withdrawn (Bank Payments Credit) - Book Voucher (Debit-Credit) - Journal Entry (Debit-Credit)
      group.investedValue = 
        group.categories.fundsAdded.debit - 
        group.categories.fundsWithdrawn.credit - 
        (group.categories.feesAndCharges.debit - group.categories.feesAndCharges.credit) - 
        (group.categories.internalAdjustment.debit - group.categories.internalAdjustment.credit);
    }

    const data = Array.from(accountGroups.values());

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error fetching ledger:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

