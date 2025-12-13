import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import * as db from '@/lib/db';
import { execute } from '@/lib/db';

// POST /api/trades/bulk-update
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt((session.user as any).id);
    const body = await request.json();
    const { action, oldSymbol, newSymbol, accountId, tradeIds, updates } = body;

    if (action === 'rename_symbol') {
      // Rename all trades with a specific symbol - user-specific
      if (!oldSymbol || !newSymbol) {
        return NextResponse.json(
          { success: false, error: 'Old symbol and new symbol are required' },
          { status: 400 }
        );
      }

      // Verify account belongs to user if provided
      if (accountId) {
        const accountIdNum = parseInt(accountId);
        if (!isNaN(accountIdNum)) {
          const account = await db.db.getAccountById(accountIdNum, userId);
          if (!account) {
            return NextResponse.json(
              { success: false, error: 'Account not found' },
              { status: 404 }
            );
          }
        }
      }

      let sql = `
        UPDATE trades t
        INNER JOIN accounts a ON t.account_id = a.id
        SET t.symbol = ?
        WHERE t.symbol = ? AND a.user_id = ?
      `;
      const params: any[] = [newSymbol, oldSymbol, userId];

      if (accountId) {
        sql += ' AND t.account_id = ?';
        params.push(parseInt(accountId));
      }

      const affectedRows = await execute(sql, params);

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

      // Add WHERE clause - user-specific via account ownership
      const placeholders = tradeIds.map(() => '?').join(',');
      params.push(...tradeIds, userId);

      const sql = `
        UPDATE trades t
        INNER JOIN accounts a ON t.account_id = a.id
        SET ${setClauses.map(clause => `t.${clause}`).join(', ')}
        WHERE t.id IN (${placeholders}) AND a.user_id = ?
      `;
      
      const affectedRows = await execute(sql, params);

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

