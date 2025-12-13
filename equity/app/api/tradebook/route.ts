import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import * as db from '@/lib/db';
import { calculateStockXIRR } from '@/lib/xirr-calculator';
import { executeKiteTool } from '@/lib/kite-service';

// Helper to fetch prices from Yahoo Finance (Free API)
async function getYahooFinancePrices(symbols: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    
    if (symbols.length === 0) {
        return prices;
    }

    console.log(`[YahooFinance] Fetching prices for ${symbols.length} symbols`);

    try {
        // Yahoo Finance uses .NS suffix for NSE stocks
        const yahooSymbols = symbols.map(symbol => `${symbol}.NS`);
        const symbolsParam = yahooSymbols.join(',');
        
        // Using Yahoo Finance v8 API
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbolsParam}?interval=1d&range=1d`;
        
        console.log(`[YahooFinance] Fetching from URL: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            console.error(`[YahooFinance] HTTP error: ${response.status}`);
            // If batch fails, try individual requests
            return await getYahooFinancePricesIndividual(symbols);
        }

        const data = await response.json();
        
        if (data?.chart?.result) {
            for (let i = 0; i < symbols.length; i++) {
                const symbol = symbols[i];
                const result = data.chart.result[i];
                
                if (result?.meta?.regularMarketPrice) {
                    prices[symbol] = result.meta.regularMarketPrice;
                    console.log(`[YahooFinance] ${symbol}: ₹${result.meta.regularMarketPrice}`);
                } else {
                    prices[symbol] = 0;
                    console.log(`[YahooFinance] ${symbol}: No price data`);
                }
            }
        }
    } catch (error: any) {
        console.error('[YahooFinance] Error fetching prices:', error.message);
        // Try individual requests as fallback
        return await getYahooFinancePricesIndividual(symbols);
    }

    return prices;
}

// Fallback: Fetch prices individually (slower but more reliable)
async function getYahooFinancePricesIndividual(symbols: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    
    console.log(`[YahooFinance] Fetching prices individually for ${symbols.length} symbols`);
    
    // Process in batches of 5 to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (symbol) => {
            try {
                const yahooSymbol = `${symbol}.NS`;
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;
                
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data?.chart?.result?.[0]?.meta?.regularMarketPrice) {
                        prices[symbol] = data.chart.result[0].meta.regularMarketPrice;
                        console.log(`[YahooFinance] ${symbol}: ₹${prices[symbol]}`);
                    } else {
                        prices[symbol] = 0;
                    }
                } else {
                    prices[symbol] = 0;
                }
            } catch (error) {
                console.error(`[YahooFinance] Error fetching ${symbol}:`, error);
                prices[symbol] = 0;
            }
        }));
        
        // Small delay between batches
        if (i + batchSize < symbols.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    return prices;
}

// Helper to get live prices (tries Kite first, falls back to Yahoo Finance)
async function getLivePrices(symbols: string[], accountId?: number, userId?: number): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};

    if (symbols.length === 0) {
        return prices;
    }

    console.log(`[getLivePrices] Fetching prices for ${symbols.length} symbols`);

    // Try Kite API first if account is authenticated
    let kiteSuccess = false;
    if (accountId && userId) {
        try {
            console.log(`[getLivePrices] Trying Kite API with accountId: ${accountId}, userId: ${userId}`);
            const instruments = symbols.map(symbol => `NSE:${symbol}`);
            const args: any = { instruments, account_id: accountId, user_id: userId };

            const result = await executeKiteTool('get_ltp', args);

            if (result && typeof result === 'object') {
                for (const symbol of symbols) {
                    const instrumentKey = `NSE:${symbol}`;
                    if (result[instrumentKey] && result[instrumentKey].last_price) {
                        prices[symbol] = result[instrumentKey].last_price;
                        console.log(`[getLivePrices-Kite] ${symbol}: ₹${result[instrumentKey].last_price}`);
                    }
                }
                
                // Check if we got any prices from Kite
                const pricesReceived = Object.keys(prices).length;
                if (pricesReceived > 0) {
                    console.log(`[getLivePrices] Successfully fetched ${pricesReceived} prices from Kite API`);
                    kiteSuccess = true;
                }
            }
        } catch (error: any) {
            console.log(`[getLivePrices] Kite API failed: ${error.message}`);
        }
    } else {
        console.log('[getLivePrices] No Kite account credentials, skipping Kite API');
    }

    // If Kite API didn't work or returned no prices, use Yahoo Finance
    if (!kiteSuccess) {
        console.log('[getLivePrices] Falling back to Yahoo Finance API');
        const yahooPrices = await getYahooFinancePrices(symbols);
        
        // Merge Yahoo prices
        for (const symbol of symbols) {
            if (!prices[symbol] || prices[symbol] === 0) {
                prices[symbol] = yahooPrices[symbol] || 0;
            }
        }
        
        const pricesReceived = Object.keys(prices).filter(s => prices[s] > 0).length;
        console.log(`[getLivePrices] Fetched ${pricesReceived}/${symbols.length} prices from Yahoo Finance`);
    }

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
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = parseInt((session.user as any).id);
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
            // Verify account belongs to user
            const account = await db.db.getAccountById(accountId, userId);
            if (!account) {
                return NextResponse.json(
                    { success: false, error: 'Account not found' },
                    { status: 404 }
                );
            }
        }

        // Build query for trades - user-specific via account ownership
        let sql = `
            SELECT t.* FROM trades t
            INNER JOIN accounts a ON t.account_id = a.id
            WHERE a.user_id = ?
        `;
        const params: any[] = [userId];

        if (accountId) {
            sql += ' AND t.account_id = ?';
            params.push(accountId);
        }

        if (fromDate) {
            sql += ' AND t.trade_date >= ?';
            params.push(fromDate);
        }

        if (toDate) {
            sql += ' AND t.trade_date <= ?';
            params.push(toDate);
        }

        sql += ' ORDER BY t.symbol, t.trade_date';

        const trades = await db.query(sql, params);

        // Get all accounts for mapping - user-specific
        const accounts = await db.db.getAccounts(userId);
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

        // Determine which account to use for live prices
        // If filtering by specific account, use that account
        // Otherwise, try to find the first authenticated account
        let accountIdForPrices: number | undefined;

        if (accountId) {
            // Use the selected account
            const account = accounts.find(a => a.id === accountId);
            console.log(`[Tradebook API] Looking for account ${accountId}, found:`, account);
            if (account && account.access_token) {
                accountIdForPrices = accountId;
                console.log(`[Tradebook API] Using selected authenticated account: ${accountIdForPrices}`);
            } else {
                console.log(`[Tradebook API] Selected account not authenticated`);
            }
        } else {
            // Use the first authenticated account
            const authenticatedAccount = accounts.find(a => a.access_token);
            if (authenticatedAccount) {
                accountIdForPrices = authenticatedAccount.id;
                console.log(`[Tradebook API] Using first authenticated account: ${accountIdForPrices} (${authenticatedAccount.name})`);
            } else {
                console.log(`[Tradebook API] No authenticated accounts found`);
            }
        }

        // Fetch live prices with authenticated account
        const livePrices = await getLivePrices(uniqueSymbols, accountIdForPrices, userId);
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
            totalUnrealizedPnL: processedGroups.reduce((sum, g) => sum + g.unrealizedPnL, 0),
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

