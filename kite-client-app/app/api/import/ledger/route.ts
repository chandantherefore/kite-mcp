import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { db } from '@/lib/db';

interface LedgerRow {
  particular: string;
  posting_date: string;
  cost_center: string;
  voucher_type: string;
  debit: string;
  credit: string;
  net_balance: string;
}

// POST /api/import/ledger
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const accountId = formData.get('accountId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const accountIdNum = parseInt(accountId);
    if (isNaN(accountIdNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    // Verify account exists
    const account = await db.getAccountById(accountIdNum);
    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as LedgerRow[];

    if (records.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No records found in CSV' },
        { status: 400 }
      );
    }

    // Import records
    let imported = 0;
    let errors: string[] = [];

    for (const record of records) {
      try {
        // Parse and validate data
        const postingDate = new Date(record.posting_date);
        
        // Parse monetary values, handling empty strings
        const debit = record.debit ? parseFloat(record.debit.replace(/,/g, '')) : 0;
        const credit = record.credit ? parseFloat(record.credit.replace(/,/g, '')) : 0;
        const netBalance = record.net_balance ? parseFloat(record.net_balance.replace(/,/g, '')) : null;

        if (isNaN(debit) || isNaN(credit)) {
          errors.push(`Invalid debit or credit for entry on ${record.posting_date}`);
          continue;
        }

        await db.insertLedger({
          account_id: accountIdNum,
          particular: record.particular || null,
          posting_date: postingDate,
          cost_center: record.cost_center || null,
          voucher_type: record.voucher_type || null,
          debit,
          credit,
          net_balance: netBalance,
        });

        imported++;
      } catch (err: any) {
        errors.push(`Error importing ledger entry on ${record.posting_date}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${imported} out of ${records.length} ledger entries`,
      imported,
      total: records.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error importing ledger:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

