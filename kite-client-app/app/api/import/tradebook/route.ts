import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { db } from '@/lib/db';

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

    // Import records
    let imported = 0;
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

        await db.insertTrade({
          account_id: accountIdNum,
          symbol: record.symbol,
          isin: record.isin || null,
          trade_date: tradeDate,
          exchange: record.exchange || null,
          segment: record.segment || null,
          series: record.series || null,
          trade_type: tradeType as 'buy' | 'sell',
          auction: record.auction === 'Yes' || record.auction === 'true' || record.auction === '1',
          quantity,
          price,
          trade_id: record.trade_id || null,
          order_id: record.order_id || null,
          order_execution_time: orderExecutionTime,
        });

        imported++;
      } catch (err: any) {
        errors.push(`Error importing trade ${record.trade_id}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${imported} out of ${records.length} trades`,
      imported,
      total: records.length,
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

