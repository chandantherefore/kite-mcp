import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculatePortfolioXIRR, calculateStockXIRR } from '@/lib/xirr-calculator';

// Helper function to get current prices from Kite (placeholder)
async function getCurrentPrices(symbols: string[]): Promise<Record<string, number>> {
  // TODO: Integrate with actual Kite API to get live prices
  // For now, returning mock data
  const prices: Record<string, number> = {};
  for (const symbol of symbols) {
    prices[symbol] = 100; // Placeholder price
  }
  return prices;
}

// GET /api/stats?accountId=[id]
export async function GET(request: NextRequest) {
  try {
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

      // Verify account exists
      const account = await db.getAccountById(accountId);
      if (!account) {
        return NextResponse.json(
          { success: false, error: 'Account not found' },
          { status: 404 }
        );
      }
    }

    // Get holdings
    const holdings = await db.getHoldings(accountId);
    
    // Get unique symbols for price fetching
    const symbols = holdings.map(h => h.symbol);
    const currentPrices = symbols.length > 0 ? await getCurrentPrices(symbols) : {};

    // Calculate portfolio value and enrich holdings
    let totalInvestment = 0;
    let totalCurrentValue = 0;

    const enrichedHoldings = await Promise.all(
      holdings.map(async (holding) => {
        const currentPrice = currentPrices[holding.symbol] || 0;
        const investment = holding.quantity * holding.avg_price;
        const currentValue = holding.quantity * currentPrice;
        const pnl = currentValue - investment;
        const pnlPercent = investment > 0 ? (pnl / investment) * 100 : 0;

        totalInvestment += investment;
        totalCurrentValue += currentValue;

        // Get trades for this symbol to calculate XIRR
        const trades = await db.getTradesForSymbol(holding.symbol, accountId);
        const stockXirr = calculateStockXIRR(
          trades,
          currentPrice,
          holding.quantity
        );

        return {
          symbol: holding.symbol,
          quantity: holding.quantity,
          avgPrice: parseFloat(holding.avg_price.toFixed(2)),
          currentPrice,
          investment: parseFloat(investment.toFixed(2)),
          currentValue: parseFloat(currentValue.toFixed(2)),
          pnl: parseFloat(pnl.toFixed(2)),
          pnlPercent: parseFloat(pnlPercent.toFixed(2)),
          xirr: stockXirr ? parseFloat(stockXirr.toFixed(2)) : null,
        };
      })
    );

    // Calculate overall P&L
    const totalPnl = totalCurrentValue - totalInvestment;
    const totalPnlPercent = totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;

    // Get ledger entries for XIRR calculation
    const ledgerEntries = await db.getLedger(accountId);
    const portfolioXirr = calculatePortfolioXIRR(
      ledgerEntries,
      totalCurrentValue
    );

    // Calculate total invested from ledger debits
    const totalInvestedFromLedger = ledgerEntries.reduce(
      (sum, entry) => sum + entry.debit,
      0
    );

    // Get account info if specific account
    let accountInfo = null;
    if (accountId) {
      accountInfo = await db.getAccountById(accountId);
    }

    return NextResponse.json({
      success: true,
      stats: {
        accountId: accountId || 'consolidated',
        accountName: accountInfo?.name || 'Consolidated',
        totalInvestment: parseFloat(totalInvestment.toFixed(2)),
        totalInvestedFromLedger: parseFloat(totalInvestedFromLedger.toFixed(2)),
        currentValue: parseFloat(totalCurrentValue.toFixed(2)),
        totalPnl: parseFloat(totalPnl.toFixed(2)),
        totalPnlPercent: parseFloat(totalPnlPercent.toFixed(2)),
        xirr: portfolioXirr ? parseFloat(portfolioXirr.toFixed(2)) : null,
        holdingsCount: enrichedHoldings.length,
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

