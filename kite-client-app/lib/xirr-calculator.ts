import { xirr } from 'xirr';

export interface CashFlow {
  date: Date;
  amount: number;
}

/**
 * Calculate XIRR for a set of cash flows
 * @param cashFlows Array of cash flows with date and amount
 * @returns XIRR as a percentage (e.g., 15.5 for 15.5%)
 */
export function calculateXIRR(cashFlows: CashFlow[]): number | null {
  if (cashFlows.length < 2) {
    return null;
  }

  try {
    // Convert to format expected by xirr library
    const xirrInput = cashFlows.map(cf => ({
      amount: cf.amount,
      when: cf.date,
    }));

    const result = xirr(xirrInput);
    
    // Convert to percentage
    return result * 100;
  } catch (error) {
    console.error('Error calculating XIRR:', error);
    return null;
  }
}

/**
 * Calculate XIRR for portfolio based on ledger entries
 * @param ledgerEntries Array of ledger entries
 * @param currentValue Current portfolio value
 * @returns XIRR as a percentage
 */
export function calculatePortfolioXIRR(
  ledgerEntries: Array<{ posting_date: Date; debit: number; credit: number }>,
  currentValue: number
): number | null {
  const cashFlows: CashFlow[] = [];

  // Process ledger entries
  for (const entry of ledgerEntries) {
    const netFlow = entry.credit - entry.debit;
    if (netFlow !== 0) {
      cashFlows.push({
        date: entry.posting_date,
        amount: netFlow,
      });
    }
  }

  // Add current value as final cash flow
  if (currentValue > 0) {
    cashFlows.push({
      date: new Date(),
      amount: currentValue,
    });
  }

  return calculateXIRR(cashFlows);
}

/**
 * Calculate XIRR for a specific stock
 * @param trades Array of trades for the stock
 * @param currentPrice Current price of the stock
 * @returns XIRR as a percentage
 */
export function calculateStockXIRR(
  trades: Array<{
    trade_date: Date;
    trade_type: 'buy' | 'sell';
    quantity: number;
    price: number;
  }>,
  currentPrice: number,
  currentQuantity: number
): number | null {
  const cashFlows: CashFlow[] = [];

  // Process trades
  for (const trade of trades) {
    const amount = trade.quantity * trade.price;
    cashFlows.push({
      date: trade.trade_date,
      amount: trade.trade_type === 'buy' ? -amount : amount,
    });
  }

  // Add current holdings value
  if (currentQuantity > 0) {
    cashFlows.push({
      date: new Date(),
      amount: currentQuantity * currentPrice,
    });
  }

  return calculateXIRR(cashFlows);
}

