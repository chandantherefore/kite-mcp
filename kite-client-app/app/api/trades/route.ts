import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

// POST /api/trades - Create a new trade
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            accountId,
            symbol,
            tradeDate,
            tradeType,
            quantity,
            price,
            exchange,
            segment,
            series,
        } = body;

        // Validate required fields
        if (!accountId || !symbol || !tradeDate || !tradeType || !quantity || !price) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: accountId, symbol, tradeDate, tradeType, quantity, price'
                },
                { status: 400 }
            );
        }

        // Validate account exists
        const account = await db.db.getAccountById(parseInt(accountId));
        if (!account) {
            return NextResponse.json(
                { success: false, error: 'Account not found' },
                { status: 404 }
            );
        }

        // Validate trade type
        if (tradeType !== 'buy' && tradeType !== 'sell') {
            return NextResponse.json(
                { success: false, error: 'Trade type must be "buy" or "sell"' },
                { status: 400 }
            );
        }

        // Validate numbers
        const qty = parseFloat(quantity);
        const prc = parseFloat(price);

        if (isNaN(qty) || qty <= 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid quantity' },
                { status: 400 }
            );
        }

        if (isNaN(prc) || prc <= 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid price' },
                { status: 400 }
            );
        }

        // Validate date
        const date = new Date(tradeDate);
        if (isNaN(date.getTime())) {
            return NextResponse.json(
                { success: false, error: 'Invalid trade date' },
                { status: 400 }
            );
        }

        // Insert the trade
        const tradeId = await db.db.insertTrade({
            account_id: parseInt(accountId),
            symbol: symbol.toUpperCase(),
            isin: null,
            trade_date: date,
            exchange: exchange || null,
            segment: segment || null,
            series: series || null,
            trade_type: tradeType,
            auction: false,
            quantity: qty,
            price: prc,
            trade_id: null,
            order_id: null,
            order_execution_time: null,
            import_batch_id: null,
            import_date: null,
        });

        // Get the created trade
        const createdTrade = await db.db.getTradeById(tradeId);

        return NextResponse.json({
            success: true,
            trade: createdTrade,
            message: 'Trade added successfully',
        });
    } catch (error: any) {
        console.error('Error creating trade:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

