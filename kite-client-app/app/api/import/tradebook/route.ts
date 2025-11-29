import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { db, query } from '@/lib/db';
import { randomUUID } from 'crypto';

interface TradebookRow {
  symbol: string;
  isin: string;
  trade_date: string;
  exchange: string;
  segment: string;
  series: string;
  trade_type: string;
  auction: string;
  quantity: string;
  price: string;
  trade_id: string;
  order_id: string;
  order_execution_time: string;
}

// POST /api/import/tradebook
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
    }) as TradebookRow[];

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
        const tradeDate = new Date(record.trade_date);
        const quantity = parseFloat(record.quantity);
        const price = parseFloat(record.price);

        if (isNaN(quantity) || isNaN(price)) {
          errors.push(`Invalid quantity or price for trade ${record.trade_id}`);
          continue;
        }

        const tradeType = record.trade_type.toLowerCase();
        if (tradeType !== 'buy' && tradeType !== 'sell') {
          errors.push(`Invalid trade type for trade ${record.trade_id}: ${record.trade_type}`);
          continue;
        }

        // Parse order execution time if available
        let orderExecutionTime = null;
        if (record.order_execution_time) {
          orderExecutionTime = new Date(record.order_execution_time);
          if (isNaN(orderExecutionTime.getTime())) {
            orderExecutionTime = null;
          }
        }

        // Check for existing trade
        const existingTrades = await query(
          'SELECT * FROM trades WHERE account_id = ? AND trade_id = ?',
          [accountIdNum, record.trade_id]
        );

        if (existingTrades.length > 0) {
          const existingTrade = existingTrades[0];
          
          // Check if data is different
          const isDifferent = 
            existingTrade.quantity !== quantity ||
            existingTrade.price !== price ||
            existingTrade.symbol !== record.symbol;

          if (isDifferent) {
            // Create conflict
            await db.createConflict({
              account_id: accountIdNum,
              import_type: 'tradebook',
              conflict_type: 'duplicate_trade_id',
              existing_data: existingTrade,
              new_data: record,
              conflict_field: 'quantity,price',
              status: 'pending',
              resolved_at: null,
              resolved_by: null,
            });
            conflicts++;
            continue;
          } else {
            // Same data, skip
            continue;
          }
        }

        // Insert new trade - ensure all values are properly null or defined
        await query(
          `INSERT INTO trades (
            account_id, symbol, isin, trade_date, exchange, segment, series,
            trade_type, auction, quantity, price, trade_id, order_id, 
            order_execution_time, import_batch_id, import_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            accountIdNum,
            record.symbol,
            record.isin && record.isin.trim() !== '' ? record.isin : null,
            tradeDate,
            record.exchange && record.exchange.trim() !== '' ? record.exchange : null,
            record.segment && record.segment.trim() !== '' ? record.segment : null,
            record.series && record.series.trim() !== '' ? record.series : null,
            tradeType,
            record.auction === 'Yes' || record.auction === 'true' || record.auction === '1',
            quantity,
            price,
            record.trade_id && record.trade_id.trim() !== '' ? record.trade_id : null,
            record.order_id && record.order_id.trim() !== '' ? record.order_id : null,
            orderExecutionTime,
            batchId,
          ]
        );

        imported++;
      } catch (err: any) {
        errors.push(`Error importing trade ${record.trade_id}: ${err.message}`);
      }
    }

    // Update account sync timestamp
    if (imported > 0) {
      await db.updateAccountSync(accountIdNum, 'tradebook', imported);
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${imported} out of ${records.length} trades`,
      imported,
      conflicts,
      total: records.length,
      batchId,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error importing tradebook:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
