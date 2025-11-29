import { NextRequest, NextResponse } from 'next/server';
import { db, query } from '@/lib/db';

// POST /api/tools/split - Apply stock split
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, symbol, splitDate, ratio } = body;

    if (!accountId || !symbol || !splitDate || !ratio) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
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

    // Parse ratio (format: "1:5" or "1:2")
    const ratioMatch = ratio.match(/^(\d+):(\d+)$/);
    if (!ratioMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid ratio format. Use format like "1:5"' },
        { status: 400 }
      );
    }

    const oldRatio = parseInt(ratioMatch[1]);
    const newRatio = parseInt(ratioMatch[2]);

    // Verify account exists
    const account = await db.getAccountById(accountIdNum);
    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    // Get trades that will be affected
    const affectedTrades = await query(
      `SELECT * FROM trades 
       WHERE account_id = ? 
         AND symbol = ? 
         AND trade_date < ?
       ORDER BY trade_date`,
      [accountIdNum, symbol, new Date(splitDate)]
    );

    if (affectedTrades.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No trades found before split date',
        affectedCount: 0,
      });
    }

    // Preview mode - just return what would be affected
    if (body.preview) {
      const multiplier = newRatio / oldRatio;
      
      const preview = affectedTrades.map((trade: any) => ({
        trade_id: trade.trade_id,
        symbol: trade.symbol,
        trade_date: trade.trade_date,
        old_quantity: trade.quantity,
        new_quantity: trade.quantity * multiplier,
        old_price: trade.price,
        new_price: trade.price / multiplier,
      }));

      return NextResponse.json({
        success: true,
        preview: true,
        affectedCount: affectedTrades.length,
        trades: preview,
      });
    }

    // Apply the split
    const rowsAffected = await db.applyStockSplit(
      accountIdNum,
      symbol,
      new Date(splitDate),
      oldRatio,
      newRatio
    );

    return NextResponse.json({
      success: true,
      message: `Split applied successfully to ${rowsAffected} trades`,
      affectedCount: rowsAffected,
      ratio: `${oldRatio}:${newRatio}`,
      multiplier: newRatio / oldRatio,
    });
  } catch (error: any) {
    console.error('Error applying split:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/tools/split/symbols?accountId=[id] - Get unique symbols for an account
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

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

    const symbols = await query(
      `SELECT DISTINCT symbol 
       FROM trades 
       WHERE account_id = ? 
       ORDER BY symbol`,
      [accountIdNum]
    );

    return NextResponse.json({
      success: true,
      symbols: symbols.map((s: any) => s.symbol),
    });
  } catch (error: any) {
    console.error('Error fetching symbols:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

