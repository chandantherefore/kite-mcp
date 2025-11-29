import { NextRequest, NextResponse } from 'next/server';
import { db, query, execute } from '@/lib/db';

// POST /api/conflicts/[id] - Resolve conflict
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conflictId = parseInt(params.id);
    
    if (isNaN(conflictId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid conflict ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, editedData } = body;

    // Valid actions: keep_existing, use_new, manual_edit, ignore
    if (!['keep_existing', 'use_new', 'manual_edit', 'ignore'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get conflict details
    const conflicts = await query(
      'SELECT * FROM import_conflicts WHERE id = ?',
      [conflictId]
    );

    if (conflicts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Conflict not found' },
        { status: 404 }
      );
    }

    const conflict = conflicts[0];

    if (action === 'use_new') {
      // Update with new data
      const newData = typeof conflict.new_data === 'string' 
        ? JSON.parse(conflict.new_data) 
        : conflict.new_data;

      if (conflict.import_type === 'tradebook') {
        await execute(
          `UPDATE trades 
           SET quantity = ?, price = ?, symbol = ?, isin = ?, exchange = ?, 
               segment = ?, series = ?, trade_type = ?, auction = ?
           WHERE account_id = ? AND trade_id = ?`,
          [
            parseFloat(newData.quantity),
            parseFloat(newData.price),
            newData.symbol,
            newData.isin || null,
            newData.exchange || null,
            newData.segment || null,
            newData.series || null,
            newData.trade_type.toLowerCase(),
            newData.auction === 'Yes' || newData.auction === 'true',
            conflict.account_id,
            newData.trade_id,
          ]
        );
      } else if (conflict.import_type === 'ledger') {
        await execute(
          `UPDATE ledger 
           SET debit = ?, credit = ?, net_balance = ?, particular = ?
           WHERE account_id = ? AND posting_date = ? AND particular = ?`,
          [
            parseFloat(newData.debit || 0),
            parseFloat(newData.credit || 0),
            newData.net_balance ? parseFloat(newData.net_balance) : null,
            newData.particular,
            conflict.account_id,
            new Date(newData.posting_date),
            conflict.existing_data.particular,
          ]
        );
      }

      await db.resolveConflict(conflictId, 'resolved_use_new');
    } else if (action === 'keep_existing') {
      // Do nothing, just mark as resolved
      await db.resolveConflict(conflictId, 'resolved_keep_existing');
    } else if (action === 'manual_edit') {
      // Update with edited data
      if (!editedData) {
        return NextResponse.json(
          { success: false, error: 'Edited data required for manual edit' },
          { status: 400 }
        );
      }

      if (conflict.import_type === 'tradebook') {
        await execute(
          `UPDATE trades 
           SET quantity = ?, price = ?, symbol = ?
           WHERE account_id = ? AND trade_id = ?`,
          [
            editedData.quantity,
            editedData.price,
            editedData.symbol,
            conflict.account_id,
            conflict.existing_data.trade_id,
          ]
        );
      } else if (conflict.import_type === 'ledger') {
        await execute(
          `UPDATE ledger 
           SET debit = ?, credit = ?, net_balance = ?
           WHERE id = ?`,
          [
            editedData.debit,
            editedData.credit,
            editedData.net_balance,
            conflict.existing_data.id,
          ]
        );
      }

      await db.resolveConflict(conflictId, 'resolved_manual');
    } else if (action === 'ignore') {
      await db.resolveConflict(conflictId, 'ignored');
    }

    return NextResponse.json({
      success: true,
      message: 'Conflict resolved successfully',
    });
  } catch (error: any) {
    console.error('Error resolving conflict:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/conflicts/[id] - Delete conflict
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conflictId = parseInt(params.id);
    
    if (isNaN(conflictId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid conflict ID' },
        { status: 400 }
      );
    }

    await db.deleteConflict(conflictId);

    return NextResponse.json({
      success: true,
      message: 'Conflict deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting conflict:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

