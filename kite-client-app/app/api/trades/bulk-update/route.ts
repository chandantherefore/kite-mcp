import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

// POST /api/trades/bulk-update
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, oldSymbol, newSymbol, accountId, tradeIds, updates } = body;

    if (action === 'rename_symbol') {
      // Rename all trades with a specific symbol
      if (!oldSymbol || !newSymbol) {
        return NextResponse.json(
          { success: false, error: 'Old symbol and new symbol are required' },
          { status: 400 }
        );
      }

      let sql = 'UPDATE trades SET symbol = ? WHERE symbol = ?';
      const params: any[] = [newSymbol, oldSymbol];

      if (accountId) {
        sql += ' AND account_id = ?';
        params.push(accountId);
      }

      const result = await db.query(sql, params);
      const affectedRows = (result as any).affectedRows || 0;

      return NextResponse.json({
        success: true,
        message: `Updated ${affectedRows} trade(s)`,
        affectedRows,
      });
    } else if (action === 'update_trades') {
      // Update specific trades by ID
      if (!tradeIds || !Array.isArray(tradeIds) || tradeIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Trade IDs are required' },
          { status: 400 }
        );
      }

      if (!updates || typeof updates !== 'object') {
        return NextResponse.json(
          { success: false, error: 'Updates object is required' },
          { status: 400 }
        );
      }

      // Build update query
      const setClauses: string[] = [];
      const params: any[] = [];

      if (updates.symbol !== undefined) {
        setClauses.push('symbol = ?');
        params.push(updates.symbol);
      }

      if (updates.quantity !== undefined) {
        const qty = parseFloat(updates.quantity);
        if (isNaN(qty) || qty <= 0) {
          return NextResponse.json(
            { success: false, error: 'Invalid quantity' },
            { status: 400 }
          );
        }
        setClauses.push('quantity = ?');
        params.push(qty);
      }

      if (updates.price !== undefined) {
        const price = parseFloat(updates.price);
        if (isNaN(price) || price <= 0) {
          return NextResponse.json(
            { success: false, error: 'Invalid price' },
            { status: 400 }
          );
        }
        setClauses.push('price = ?');
        params.push(price);
      }

      if (setClauses.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid updates provided' },
          { status: 400 }
        );
      }

      // Add WHERE clause
      const placeholders = tradeIds.map(() => '?').join(',');
      params.push(...tradeIds);

      const sql = `UPDATE trades SET ${setClauses.join(', ')} WHERE id IN (${placeholders})`;
      
      const result = await db.query(sql, params);
      const affectedRows = (result as any).affectedRows || 0;

      return NextResponse.json({
        success: true,
        message: `Updated ${affectedRows} trade(s)`,
        affectedRows,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error in bulk update:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

