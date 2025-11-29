import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { db, query } from '@/lib/db';
import { randomUUID } from 'crypto';

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

    // Generate batch ID for this import
    const batchId = randomUUID();

    // Import records with conflict detection
    let imported = 0;
    let conflicts = 0;
    let errors: string[] = [];

    for (const record of records) {
      try {
        // Parse and validate data
        const postingDate = new Date(record.posting_date);
        
        // Parse monetary values, handling empty strings and undefined
        const debit = record.debit && record.debit.trim() !== '' 
          ? parseFloat(record.debit.replace(/,/g, '')) 
          : 0;
        const credit = record.credit && record.credit.trim() !== '' 
          ? parseFloat(record.credit.replace(/,/g, '')) 
          : 0;
        const netBalance = record.net_balance && record.net_balance.trim() !== '' 
          ? parseFloat(record.net_balance.replace(/,/g, '')) 
          : null;

        if (isNaN(debit) || isNaN(credit)) {
          errors.push(`Invalid debit or credit for entry on ${record.posting_date}`);
          continue;
        }

        // Check for existing ledger entry (similar date, particular, and amounts)
        const particular = record.particular && record.particular.trim() !== '' ? record.particular : null;
        const existingEntries = await query(
          `SELECT * FROM ledger 
           WHERE account_id = ? 
           AND posting_date = ? 
           AND (particular = ? OR (particular IS NULL AND ? IS NULL))
           AND debit = ? 
           AND credit = ?`,
          [accountIdNum, postingDate, particular, particular, debit, credit]
        );

        if (existingEntries.length > 0) {
          // Exact duplicate, skip silently
          continue;
        }

        // Check for partial match (same date and particular but different amounts)
        const partialMatches = await query(
          `SELECT * FROM ledger 
           WHERE account_id = ? 
           AND posting_date = ? 
           AND (particular = ? OR (particular IS NULL AND ? IS NULL))`,
          [accountIdNum, postingDate, particular, particular]
        );

        if (partialMatches.length > 0) {
          // Create conflict for different amounts
          await db.createConflict({
            account_id: accountIdNum,
            import_type: 'ledger',
            conflict_type: 'duplicate_entry_different_amount',
            existing_data: partialMatches[0],
            new_data: record,
            conflict_field: 'debit,credit',
            status: 'pending',
            resolved_at: null,
            resolved_by: null,
          });
          conflicts++;
          continue;
        }

        // Insert new ledger entry - ensure all values are properly null or defined
        await query(
          `INSERT INTO ledger (
            account_id, particular, posting_date, cost_center, voucher_type,
            debit, credit, net_balance, import_batch_id, import_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            accountIdNum,
            record.particular && record.particular.trim() !== '' ? record.particular : null,
            postingDate,
            record.cost_center && record.cost_center.trim() !== '' ? record.cost_center : null,
            record.voucher_type && record.voucher_type.trim() !== '' ? record.voucher_type : null,
            debit,
            credit,
            netBalance,
            batchId,
          ]
        );

        imported++;
      } catch (err: any) {
        errors.push(`Error importing ledger entry on ${record.posting_date}: ${err.message}`);
      }
    }

    // Update account sync timestamp
    if (imported > 0) {
      await db.updateAccountSync(accountIdNum, 'ledger', imported);
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${imported} out of ${records.length} ledger entries`,
      imported,
      conflicts,
      total: records.length,
      batchId,
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
