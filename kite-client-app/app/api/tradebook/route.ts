import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { calculateStockXIRR } from '@/lib/xirr-calculator';
import { executeKiteTool } from '@/lib/kite-service';

// Helper to get live prices
async function getLivePrices(symbols: string[], clientId?: string): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};

    if (symbols.length === 0) {
        return prices;
    }

    console.log(`[getLivePrices] Fetching prices for ${symbols.length} symbols, clientId: ${clientId || 'auto-detect'}`);

    try {
        const instruments = symbols.map(symbol => `NSE:${symbol}`);
        const args: any = { instruments };

        // Add client_id if provided
        if (clientId) {
            args.client_id = clientId;
        }

        console.log('[getLivePrices] Calling executeKiteTool with args:', JSON.stringify(args, null, 2));
        const result = await executeKiteTool('get_ltp', args);
        console.log('[getLivePrices] Result received:', result ? 'Data received' : 'No data');

        if (result && typeof result === 'object') {
            for (const symbol of symbols) {
                const instrumentKey = `NSE:${symbol}`;
                if (result[instrumentKey] && result[instrumentKey].last_price) {
                    prices[symbol] = result[instrumentKey].last_price;
                    console.log(`[getLivePrices] ${symbol}: ₹${result[instrumentKey].last_price}`);
                } else {
                    prices[symbol] = 0;
                    console.log(`[getLivePrices] ${symbol}: No price data available`);
                }
            }
        } else {
            console.error('[getLivePrices] Invalid result format:', result);
        }
    } catch (error: any) {
        console.error('[getLivePrices] Error fetching live prices:', error);
        console.error('[getLivePrices] Error stack:', error.stack);
        console.error('[getLivePrices] Error message:', error.message);
        // Set all symbols to 0 on error
        for (const symbol of symbols) {
            prices[symbol] = 0;
        }
    }

    console.log(`[getLivePrices] Final prices object:`, prices);
    return prices;
}

interface TradeGroup {
    symbol: string;
    accountId: number;
    accountName: string;
    totalBuyQuantity: number;
    totalSellQuantity: number;
    netQuantity: number;
    totalBuyValue: number;
    totalSellValue: number;
    avgBuyPrice: number;
    avgSellPrice: number;
    currentPrice: number;
    currentValue: number;
    realizedPnL: number;
    realizedPnLPercent: number;
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
    totalPnL: number;
    status: 'active' | 'sold';
    xirr: number | null;
    trades: any[];
    firstTradeDate: Date;
    lastTradeDate: Date;
}

// GET /api/tradebook?accountId=[id]&fromDate=[date]&toDate=[date]&status=[active|sold|all]
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const accountIdParam = searchParams.get('accountId');
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');
        const status = searchParams.get('status') || 'all'; // all, active, sold

        let accountId: number | undefined;

        if (accountIdParam && accountIdParam !== 'consolidated') {
            accountId = parseInt(accountIdParam);
            if (isNaN(accountId)) {
                return NextResponse.json(
                    { success: false, error: 'Invalid account ID' },
                    { status: 400 }
                );
            }
        }

        // Build query for trades
        let sql = 'SELECT * FROM trades WHERE 1=1';
        const params: any[] = [];

        if (accountId) {
            sql += ' AND account_id = ?';
            params.push(accountId);
        }

        if (fromDate) {
            sql += ' AND trade_date >= ?';
            params.push(fromDate);
        }

        if (toDate) {
            sql += ' AND trade_date <= ?';
            params.push(toDate);
        }

        sql += ' ORDER BY symbol, trade_date';

        const trades = await db.query(sql, params);

        // Get all accounts for mapping
        const accounts = await db.db.getAccounts();
        const accountMap = new Map(accounts.map(a => [a.id, a.name]));

        // Group trades by symbol and account
        const tradeGroups = new Map<string, TradeGroup>();

        for (const trade of trades) {
            const key = `${trade.symbol}_${trade.account_id}`;

            if (!tradeGroups.has(key)) {
                tradeGroups.set(key, {
                    symbol: trade.symbol,
                    accountId: trade.account_id,
                    accountName: accountMap.get(trade.account_id) || 'Unknown',
                    totalBuyQuantity: 0,
                    totalSellQuantity: 0,
                    netQuantity: 0,
                    totalBuyValue: 0,
                    totalSellValue: 0,
                    avgBuyPrice: 0,
                    avgSellPrice: 0,
                    currentPrice: 0,
                    currentValue: 0,
                    realizedPnL: 0,
                    realizedPnLPercent: 0,
                    unrealizedPnL: 0,
                    unrealizedPnLPercent: 0,
                    totalPnL: 0,
                    status: 'active',
                    xirr: null,
                    trades: [],
                    firstTradeDate: trade.trade_date,
                    lastTradeDate: trade.trade_date,
                });
            }

            const group = tradeGroups.get(key)!;
            group.trades.push(trade);

            // Update date range
            if (new Date(trade.trade_date) < new Date(group.firstTradeDate)) {
                group.firstTradeDate = trade.trade_date;
            }
            if (new Date(trade.trade_date) > new Date(group.lastTradeDate)) {
                group.lastTradeDate = trade.trade_date;
            }

            // Accumulate quantities and values (convert to numbers)
            const qty = parseFloat(trade.quantity.toString());
            const price = parseFloat(trade.price.toString());

            if (trade.trade_type === 'buy') {
                group.totalBuyQuantity += qty;
                group.totalBuyValue += qty * price;
            } else {
                group.totalSellQuantity += qty;
                group.totalSellValue += qty * price;
            }
        }

        // Get live prices for all symbols
        const uniqueSymbols = Array.from(new Set(
            Array.from(tradeGroups.keys()).map(key => key.split('_')[0])
        ));

        console.log(`[Tradebook API] Processing ${uniqueSymbols.length} unique symbols`);

        // Determine which client_id to use for live prices
        // If filtering by specific account, use that account's client_id
        // Otherwise, try to find the first authenticated account
        let clientIdForPrices: string | undefined;

        if (accountId) {
            // Find the account and get its client_id/broker_id
            const account = accounts.find(a => a.id === accountId);
            console.log(`[Tradebook API] Looking for account ${accountId}, found:`, account);
            if (account && account.broker_id) {
                clientIdForPrices = account.broker_id;
                console.log(`[Tradebook API] Using broker_id as client_id: ${clientIdForPrices}`);
            } else {
                console.log(`[Tradebook API] Account found but no broker_id set`);
            }
        } else {
            console.log(`[Tradebook API] No specific account selected, will use any available session`);
        }

        // If no specific account or broker_id not set, let getSession handle it
        // (it will use the first available session if only one exists)
        const livePrices = await getLivePrices(uniqueSymbols, clientIdForPrices);
        console.log(`[Tradebook API] Live prices fetched:`, livePrices);

        // Calculate derived values for each group
        const processedGroups: TradeGroup[] = [];

        for (const group of tradeGroups.values()) {
            // Calculate net quantity
            group.netQuantity = group.totalBuyQuantity - group.totalSellQuantity;

            // Calculate average prices
            group.avgBuyPrice = group.totalBuyQuantity > 0
                ? group.totalBuyValue / group.totalBuyQuantity
                : 0;

            group.avgSellPrice = group.totalSellQuantity > 0
                ? group.totalSellValue / group.totalSellQuantity
                : 0;

            // Get current price
            const currentPrice = livePrices[group.symbol] || 0;
            group.currentPrice = currentPrice;

            // Calculate current value (for active holdings)
            group.currentValue = group.netQuantity * currentPrice;

            // Calculate realized P&L (from completed sales)
            const soldQuantity = group.totalSellQuantity;
            const costOfSold = soldQuantity * group.avgBuyPrice;
            group.realizedPnL = group.totalSellValue - costOfSold;
            group.realizedPnLPercent = costOfSold > 0
                ? (group.realizedPnL / costOfSold) * 100
                : 0;

            // Calculate unrealized P&L (from active holdings)
            const activeCost = group.netQuantity * group.avgBuyPrice;
            group.unrealizedPnL = group.currentValue - activeCost;
            group.unrealizedPnLPercent = activeCost > 0
                ? (group.unrealizedPnL / activeCost) * 100
                : 0;

            // Total P&L
            group.totalPnL = group.realizedPnL + group.unrealizedPnL;

            // Determine status
            group.status = group.netQuantity === 0 ? 'sold' : 'active';

            // Calculate XIRR
            try {
                group.xirr = calculateStockXIRR(
                    group.trades,
                    currentPrice,
                    group.netQuantity
                );
            } catch (err) {
                group.xirr = null;
            }

            // Apply status filter
            if (status === 'active' && group.status !== 'active') continue;
            if (status === 'sold' && group.status !== 'sold') continue;

            processedGroups.push(group);
        }

        // Sort by symbol
        processedGroups.sort((a, b) => a.symbol.localeCompare(b.symbol));

        // Calculate summary stats
        const summary = {
            totalStocks: processedGroups.length,
            activeStocks: processedGroups.filter(g => g.status === 'active').length,
            soldStocks: processedGroups.filter(g => g.status === 'sold').length,
            totalBuyValue: processedGroups.reduce((sum, g) => sum + g.totalBuyValue, 0),
            totalSellValue: processedGroups.reduce((sum, g) => sum + g.totalSellValue, 0),
            totalRealizedPnL: processedGroups.reduce((sum, g) => sum + g.realizedPnL, 0),
        };

        return NextResponse.json({
            success: true,
            data: {
                groups: processedGroups,
                summary,
            },
        });
    } catch (error: any) {
        console.error('Error fetching tradebook:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

