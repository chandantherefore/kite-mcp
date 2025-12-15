# Troubleshooting: Current Price Showing as 0

## Problem
The "Current Price" column in Holdings page shows ₹0 for all stocks.

---

## Why This Happens

The current prices are fetched from **Yahoo Finance API** (free, no authentication required). When prices show as 0, it means:

1. ❌ Yahoo Finance API failed to return prices
2. ❌ Symbol format is incorrect
3. ❌ Network connectivity issue
4. ❌ Rate limiting by Yahoo Finance
5. ❌ Market is closed and no previous close available

---

## Quick Diagnosis Steps

### Step 1: Check Server Logs

When you load the Holdings page, check your Next.js server console for these logs:

```
[Stats API] Fetching prices for 5 symbols: [ 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK' ]
[YahooFinance] Fetching prices for 5 symbols...
[YahooFinance] RELIANCE: ₹2500.00
[YahooFinance] TCS: ₹3800.00
[YahooFinance] INFY: ₹1450.00
[YahooFinance] HDFCBANK: ₹1600.00
[YahooFinance] ICICIBANK: ₹950.00
[Stats API] Prices received: { RELIANCE: 2500, TCS: 3800, INFY: 1450, ... }
```

**If you see errors:**
```
[YahooFinance] HTTP error: 429  ← Rate limited
[YahooFinance] HTTP error: 403  ← Blocked
[YahooFinance] HTTP error: 500  ← Yahoo Finance down
[YahooFinance] No price data for SOMESTOCK  ← Symbol not found
```

### Step 2: Test Yahoo Finance Directly

Run the test script:

```bash
cd equity
node test-yahoo-prices.js
```

This will:
- Test Yahoo Finance API directly
- Show which symbols work and which don't
- Give specific error messages

### Step 3: Check Browser Network Tab

1. Open Holdings page
2. Press F12 (DevTools)
3. Go to Network tab
4. Look for `/api/stats` request
5. Check the response - prices should be non-zero

---

## Common Issues & Solutions

### Issue 1: All Prices Are 0

**Symptom**: Every stock shows ₹0

**Causes**:
- Yahoo Finance API is down or rate-limiting
- Network/firewall blocking requests
- Incorrect symbol format

**Solutions**:

#### Solution 1A: Wait and Retry
Yahoo Finance has rate limits. Wait 5-10 minutes and reload the page.

#### Solution 1B: Check Internet Connection
```bash
# Test if you can reach Yahoo Finance
curl "https://query1.finance.yahoo.com/v7/finance/quote?symbols=RELIANCE.NS"
```

#### Solution 1C: Use Alternative Exchange
If NSE symbols don't work, try BSE:

Edit `equity/app/api/stats/route.ts` line 56:
```typescript
// Change from NSE to BSE
const currentPrices = symbols.length > 0 ? await getYahooPrices(symbols, 'BSE') : {};
```

#### Solution 1D: Add Retry Logic

Edit `equity/lib/yahoo-finance.ts` and add retry:

```typescript
export async function getCurrentPrices(
  symbols: string[],
  exchange: 'NSE' | 'BSE' = 'NSE',
  retries: number = 3
): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};

  if (symbols.length === 0) {
    return prices;
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // ... existing code ...
      
      // If successful, return
      if (Object.keys(prices).length > 0) {
        return prices;
      }
    } catch (error: any) {
      console.error(`[YahooFinance] Attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < retries - 1) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  
  // ... rest of code ...
}
```

---

### Issue 2: Some Symbols Are 0, Others Work

**Symptom**: RELIANCE shows ₹2500, but SOMESTOCK shows ₹0

**Cause**: Symbol doesn't exist on Yahoo Finance or needs different format

**Solutions**:

#### Solution 2A: Check Symbol on Yahoo Finance
Visit: `https://finance.yahoo.com/quote/YOURSTOCK.NS`

If it shows "Symbol not found", the stock isn't available on Yahoo Finance.

#### Solution 2B: Map Incorrect Symbols

Create a symbol mapping file `equity/lib/symbol-mapping.ts`:

```typescript
// Map your symbols to Yahoo Finance symbols
export const SYMBOL_MAP: Record<string, string> = {
  'NIFTY': '^NSEI',           // Nifty 50 index
  'BANKNIFTY': '^NSEBANK',    // Bank Nifty index
  'VEDL': 'VEDL.NS',          // Already correct
  // Add more mappings as needed
};

export function mapSymbol(symbol: string, exchange: 'NSE' | 'BSE'): string {
  // Check if symbol has a custom mapping
  if (SYMBOL_MAP[symbol]) {
    return SYMBOL_MAP[symbol];
  }
  
  // Otherwise use default format
  const suffix = exchange === 'BSE' ? '.BO' : '.NS';
  return `${symbol}${suffix}`;
}
```

Then update `equity/lib/yahoo-finance.ts`:

```typescript
import { mapSymbol } from './symbol-mapping';

function formatSymbolForYahoo(symbol: string, exchange: 'NSE' | 'BSE' = 'NSE'): string {
  return mapSymbol(symbol, exchange);
}
```

---

### Issue 3: Prices Work Sometimes, Not Others

**Symptom**: Prices load correctly sometimes, show 0 other times

**Cause**: Rate limiting

**Solution**: Implement caching

Create `equity/lib/price-cache.ts`:

```typescript
interface CachedPrice {
  price: number;
  timestamp: number;
}

const cache: Map<string, CachedPrice> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getCachedPrice(symbol: string): number | null {
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price;
  }
  return null;
}

export function setCachedPrice(symbol: string, price: number): void {
  cache.set(symbol, { price, timestamp: Date.now() });
}

export function clearCache(): void {
  cache.clear();
}
```

Then update `equity/lib/yahoo-finance.ts`:

```typescript
import { getCachedPrice, setCachedPrice } from './price-cache';

export async function getCurrentPrices(
  symbols: string[],
  exchange: 'NSE' | 'BSE' = 'NSE'
): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  
  // Check cache first
  const symbolsToFetch: string[] = [];
  for (const symbol of symbols) {
    const cached = getCachedPrice(symbol);
    if (cached !== null) {
      prices[symbol] = cached;
    } else {
      symbolsToFetch.push(symbol);
    }
  }
  
  if (symbolsToFetch.length === 0) {
    console.log('[YahooFinance] All prices from cache');
    return prices;
  }
  
  // Fetch remaining from Yahoo Finance
  console.log(`[YahooFinance] Fetching ${symbolsToFetch.length} prices (${symbols.length - symbolsToFetch.length} cached)`);
  
  // ... existing fetch logic for symbolsToFetch ...
  
  // Cache the fetched prices
  for (const [symbol, price] of Object.entries(fetchedPrices)) {
    setCachedPrice(symbol, price);
    prices[symbol] = price;
  }
  
  return prices;
}
```

---

### Issue 4: Prices Are Stale/Old

**Symptom**: Prices don't update even after market hours

**Cause**: Yahoo Finance returns previous close when market is closed

**Solution**: Add timestamp to show when price was last updated

Update `equity/app/holdings/page.tsx`:

```typescript
interface ManualHolding {
  symbol: string;
  accountId: number;
  accountName: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  priceUpdatedAt?: string;  // NEW
  // ... rest of fields
}
```

And show it in the UI:

```tsx
<td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">
  ₹{holding.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
  {holding.priceUpdatedAt && (
    <div className="text-xs text-gray-400">
      {new Date(holding.priceUpdatedAt).toLocaleTimeString()}
    </div>
  )}
</td>
```

---

## Alternative: Use a Different Price Source

If Yahoo Finance consistently fails, consider:

### Option 1: Use NSE API (Requires Setup)
NSE provides official market data but requires registration.

### Option 2: Use Alpha Vantage (Free Tier)
- Sign up at: https://www.alphavantage.co/
- Get free API key (500 calls/day)
- More reliable than Yahoo Finance

### Option 3: Manual Price Entry
Add a feature to manually update prices:

```typescript
// New API endpoint: /api/manual-prices
// Allows admin to set current prices manually
```

---

## Emergency Fallback: Use Last Trade Price

If current prices are unavailable, use the last trade price from your tradebook:

Update `equity/app/api/stats/route.ts`:

```typescript
const currentPrice = currentPrices[holding.symbol] 
  || holding.last_trade_price  // Fallback to last known price
  || holding.avg_price         // Or average purchase price
  || 0;
```

Add this to the database query in `equity/lib/db.ts`:

```sql
SELECT 
  t.symbol,
  t.account_id,
  a.name as account_name,
  SUM(CASE WHEN t.trade_type = 'buy' THEN t.quantity ELSE -t.quantity END) as quantity,
  SUM(CASE WHEN t.trade_type = 'buy' THEN t.quantity * t.price ELSE 0 END) / 
    NULLIF(SUM(CASE WHEN t.trade_type = 'buy' THEN t.quantity ELSE 0 END), 0) as avg_price,
  MAX(t.price) as last_trade_price,  -- NEW: Last known price
  MAX(t.trade_date) as last_trade_date  -- NEW: When it was traded
FROM trades t
INNER JOIN accounts a ON t.account_id = a.id
WHERE a.user_id = ?
GROUP BY t.symbol, t.account_id, a.name
```

---

## Testing Checklist

After implementing a fix, verify:

- [ ] Prices load on page refresh
- [ ] Server logs show successful Yahoo Finance calls
- [ ] No rate limiting errors
- [ ] Prices update when market is open
- [ ] All symbols have prices (or fallback values)
- [ ] Current Value calculates correctly (qty × price)
- [ ] Unrealized P&L updates with new prices

---

## Debug Mode

Enable detailed logging temporarily:

In `equity/lib/yahoo-finance.ts`, add more logs:

```typescript
console.log('[YahooFinance] Request URL:', url);
console.log('[YahooFinance] Response status:', response.status);
console.log('[YahooFinance] Response headers:', Object.fromEntries(response.headers.entries()));
console.log('[YahooFinance] Raw response:', await response.text());
```

---

## Contact Support

If none of these solutions work:

1. Share your server logs
2. Run `node equity/test-yahoo-prices.js` and share output
3. Check if Yahoo Finance website works: https://finance.yahoo.com/quote/RELIANCE.NS
4. Verify your symbols exist on Yahoo Finance

---

## Summary

**Most Common Cause**: Yahoo Finance rate limiting or temporary API issues

**Quick Fix**: Wait 5-10 minutes and reload

**Long-term Solution**: Implement caching and retry logic

**Nuclear Option**: Switch to a different price data provider

