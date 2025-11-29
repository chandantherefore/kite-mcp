import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

// GET /api/trades/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tradeId = parseInt(params.id);
    if (isNaN(tradeId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid trade ID' },
        { status: 400 }
      );
    }

    const trade = await db.db.getTradeById(tradeId);
    
    if (!trade) {
      return NextResponse.json(
        { success: false, error: 'Trade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      trade,
    });
  } catch (error: any) {
    console.error('Error fetching trade:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/trades/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tradeId = parseInt(params.id);
    if (isNaN(tradeId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid trade ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { symbol, quantity, price } = body;

    // Validate inputs
    if (symbol && typeof symbol !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid symbol' },
        { status: 400 }
      );
    }

    if (quantity !== undefined) {
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid quantity' },
          { status: 400 }
        );
      }
    }

    if (price !== undefined) {
      const prc = parseFloat(price);
      if (isNaN(prc) || prc <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid price' },
          { status: 400 }
        );
      }
    }

    // Update the trade
    await db.db.updateTrade(tradeId, {
      symbol,
      quantity: quantity !== undefined ? parseFloat(quantity) : undefined,
      price: price !== undefined ? parseFloat(price) : undefined,
    });

    // Get updated trade
    const updatedTrade = await db.db.getTradeById(tradeId);

    return NextResponse.json({
      success: true,
      trade: updatedTrade,
    });
  } catch (error: any) {
    console.error('Error updating trade:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/trades/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tradeId = parseInt(params.id);
    if (isNaN(tradeId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid trade ID' },
        { status: 400 }
      );
    }

    await db.db.deleteTrade(tradeId);

    return NextResponse.json({
      success: true,
      message: 'Trade deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting trade:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

