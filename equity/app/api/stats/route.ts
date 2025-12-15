import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { calculatePortfolioXIRR, calculateStockXIRR } from '@/lib/xirr-calculator';
import { getCurrentPrices as getYahooPrices } from '@/lib/yahoo-finance';

// GET /api/stats?accountId=[id]
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

    let accountId: number | undefined;

    if (accountIdParam && accountIdParam !== 'consolidated') {
      accountId = parseInt(accountIdParam);
      if (isNaN(accountId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid account ID' },
          { status: 400 }
        );
      }

      // Verify account exists and belongs to user
      const account = await db.getAccountById(accountId, userId);
      if (!account) {
        return NextResponse.json(
          { success: false, error: 'Account not found' },
          { status: 404 }
        );
      }
    }

    // Helper to ensure all values are numbers
    const safeNumber = (val: any): number => {
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };

    // Get holdings (including closed positions) - user-specific
    const holdings = await db.getHoldings(userId, accountId, true);

    // Get unique symbols for price fetching (using Yahoo Finance - Free!)
    const symbols = holdings.map(h => h.symbol);
    console.log(`[Stats API] Fetching prices for ${symbols.length} symbols:`, symbols);
    const currentPrices = symbols.length > 0 ? await getYahooPrices(symbols, 'NSE') : {};
    console.log('[Stats API] Prices received:', currentPrices);

    // Log which symbols have 0 prices
    const zeroPrices = symbols.filter(s => !currentPrices[s] || currentPrices[s] === 0);
    if (zeroPrices.length > 0) {
      console.warn('[Stats API] ⚠️  Symbols with 0 or missing prices:', zeroPrices);
    }

    // Calculate portfolio value and enrich holdings
    let totalInvestment = 0;
    let totalCurrentValue = 0;
    let totalRealizedPnL = 0;
    let totalUnrealizedPnL = 0;
    let totalSoldValue = 0;
    let totalSoldCost = 0;

    const enrichedHoldings = await Promise.all(
      holdings.map(async (holding) => {
        // Get all trades for this symbol to calculate actual P&L - user-specific
        const trades = await db.getTradesForSymbol(holding.symbol, userId, accountId);

        // Calculate investment (total buy amount)
        const totalBuyAmount = trades
          .filter(t => t.trade_type === 'buy')
          .reduce((sum, t) => sum + (t.quantity * t.price), 0);

        // Calculate sell proceeds
        const totalSellAmount = trades
          .filter(t => t.trade_type === 'sell')
          .reduce((sum, t) => sum + (t.quantity * t.price), 0);

        const currentPrice = currentPrices[holding.symbol] || 0;
        const currentQuantity = parseFloat(holding.quantity.toString());

        // Current value (for remaining holdings ONLY)
        const currentValue = currentQuantity * currentPrice;

        // Realized P&L (from completed sales) - approximate using FIFO
        const avgBuyPrice = holding.avg_price || 0;
        const soldQuantity = trades
          .filter(t => t.trade_type === 'sell')
          .reduce((sum, t) => sum + t.quantity, 0);
        const soldCost = soldQuantity * avgBuyPrice;
        const realizedPnL = totalSellAmount - soldCost;

        // Unrealized P&L (from current holdings)
        const unrealizedPnL = currentValue - (currentQuantity * avgBuyPrice);

        // Total P&L = Realized + Unrealized
        const totalPnL = realizedPnL + unrealizedPnL;

        // Investment = Cost basis of CURRENT holdings only (not all-time purchases)
        const investment = currentQuantity * avgBuyPrice;
        const pnlPercent = investment > 0 ? (totalPnL / investment) * 100 : 0;

        totalInvestment += investment;
        totalCurrentValue += currentValue; // Only active holdings
        totalRealizedPnL += realizedPnL;
        totalUnrealizedPnL += unrealizedPnL;
        totalSoldValue += totalSellAmount;
        totalSoldCost += soldCost;

        // Calculate XIRR
        const stockXirr = calculateStockXIRR(
          trades,
          currentPrice,
          currentQuantity
        );

        return {
          symbol: holding.symbol,
          accountId: holding.account_id,
          accountName: holding.account_name || 'Unknown',
          quantity: currentQuantity,
          avgPrice: parseFloat(safeNumber(avgBuyPrice).toFixed(2)),
          currentPrice,
          investment: parseFloat(safeNumber(investment).toFixed(2)),
          currentValue: parseFloat(safeNumber(currentValue).toFixed(2)),
          pnl: parseFloat(safeNumber(totalPnL).toFixed(2)),
          pnlPercent: parseFloat(safeNumber(pnlPercent).toFixed(2)),
          realizedPnL: parseFloat(safeNumber(realizedPnL).toFixed(2)),
          unrealizedPnL: parseFloat(safeNumber(unrealizedPnL).toFixed(2)),
          xirr: stockXirr ? parseFloat(safeNumber(stockXirr).toFixed(2)) : null,
        };
      })
    );

    // Calculate overall P&L (realized + unrealized)
    const totalPnl = totalRealizedPnL + totalUnrealizedPnL;
    const totalPnlPercent = totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;

    // Get ledger entries for XIRR calculation - user-specific
    const ledgerEntries = await db.getLedger(userId, accountId);
    const portfolioXirr = calculatePortfolioXIRR(
      ledgerEntries,
      totalCurrentValue
    );

    // Calculate total invested from ledger debits
    const totalInvestedFromLedger = ledgerEntries && ledgerEntries.length > 0
      ? ledgerEntries.reduce((sum, entry) => sum + (entry.debit || 0), 0)
      : 0;

    // Get account info if specific account - user-specific
    let accountInfo = null;
    if (accountId) {
      accountInfo = await db.getAccountById(accountId, userId);
    }

    return NextResponse.json({
      success: true,
      stats: {
        accountId: accountId || 'consolidated',
        accountName: accountInfo?.name || 'Consolidated',
        totalInvestment: parseFloat(safeNumber(totalInvestment).toFixed(2)),
        totalInvestedFromLedger: parseFloat(safeNumber(totalInvestedFromLedger).toFixed(2)),
        currentValue: parseFloat(safeNumber(totalCurrentValue).toFixed(2)),
        totalPnl: parseFloat(safeNumber(totalPnl).toFixed(2)),
        totalPnlPercent: parseFloat(safeNumber(totalPnlPercent).toFixed(2)),
        totalRealizedPnL: parseFloat(safeNumber(totalRealizedPnL).toFixed(2)),
        totalUnrealizedPnL: parseFloat(safeNumber(totalUnrealizedPnL).toFixed(2)),
        totalSoldValue: parseFloat(safeNumber(totalSoldValue).toFixed(2)),
        totalSoldCost: parseFloat(safeNumber(totalSoldCost).toFixed(2)),
        xirr: portfolioXirr ? parseFloat(safeNumber(portfolioXirr).toFixed(2)) : null,
        holdingsCount: enrichedHoldings.length,
        activeHoldingsCount: enrichedHoldings.filter(h => h.quantity > 0).length,
        soldHoldingsCount: enrichedHoldings.filter(h => h.quantity === 0).length,
        holdings: enrichedHoldings,
      },
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

