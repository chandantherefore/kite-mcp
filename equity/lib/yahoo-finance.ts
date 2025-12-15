/**
 * Yahoo Finance API Service
 * Free stock price fetching without authentication
 */

interface YahooQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketTime: number;
  currency: string;
}

interface YahooFinanceResponse {
  quoteResponse: {
    result: Array<{
      symbol: string;
      regularMarketPrice?: number;
      regularMarketPreviousClose?: number;
    }>;
    error: any;
  };
}

/**
 * Convert Indian stock symbols to Yahoo Finance format
 * Examples:
 * - RELIANCE -> RELIANCE.NS (NSE)
 * - TCS -> TCS.NS (NSE)
 * - INFY -> INFY.NS (NSE)
 */
function formatSymbolForYahoo(symbol: string, exchange: 'NSE' | 'BSE' = 'NSE'): string {
  // Remove any existing suffix
  const cleanSymbol = symbol.replace(/\.(NS|BO)$/i, '');

  // Add appropriate suffix
  // .NS for NSE (National Stock Exchange)
  // .BO for BSE (Bombay Stock Exchange)
  const suffix = exchange === 'BSE' ? '.BO' : '.NS';
  return `${cleanSymbol}${suffix}`;
}

/**
 * Fetch current prices for multiple symbols from Yahoo Finance
 * @param symbols Array of stock symbols (e.g., ['RELIANCE', 'TCS', 'INFY'])
 * @param exchange Exchange to use (NSE or BSE), defaults to NSE
 * @returns Object mapping symbol to price
 */
export async function getCurrentPrices(
  symbols: string[],
  exchange: 'NSE' | 'BSE' = 'NSE'
): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};

  if (symbols.length === 0) {
    return prices;
  }

  try {
    // Fetch prices one by one using v8/finance/chart endpoint (more reliable)
    console.log(`[YahooFinance] Fetching prices for ${symbols.length} symbols...`);

    for (const symbol of symbols) {
      try {
        const formattedSymbol = formatSymbolForYahoo(symbol, exchange);

        // Use v8/finance/chart endpoint which is more stable
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=1d&range=1d`;

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://finance.yahoo.com',
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout per symbol
        });

        if (!response.ok) {
          console.warn(`[YahooFinance] HTTP error for ${symbol}: ${response.status}`);
          prices[symbol] = 0;
          continue;
        }

        const data = await response.json();

        // Extract price from chart data
        const result = data?.chart?.result?.[0];
        const currentPrice = result?.meta?.regularMarketPrice
          || result?.meta?.previousClose
          || result?.indicators?.quote?.[0]?.close?.slice(-1)[0];

        if (currentPrice && currentPrice > 0) {
          prices[symbol] = currentPrice;
          console.log(`[YahooFinance] ${symbol}: ₹${currentPrice.toFixed(2)}`);
        } else {
          prices[symbol] = 0;
          console.warn(`[YahooFinance] No price data for ${symbol}`);
        }

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (symbolError: any) {
        console.error(`[YahooFinance] Error fetching ${symbol}:`, symbolError.message);
        prices[symbol] = 0;
      }
    }

    console.log(`[YahooFinance] Successfully fetched prices for ${Object.keys(prices).length} symbols`);
    return prices;

  } catch (error: any) {
    console.error('[YahooFinance] Error fetching prices:', error.message);

    // Return zero prices for all symbols on error
    for (const symbol of symbols) {
      prices[symbol] = 0;
    }

    return prices;
  }
}

/**
 * Fetch price for a single symbol
 * @param symbol Stock symbol (e.g., 'RELIANCE')
 * @param exchange Exchange to use (NSE or BSE)
 * @returns Current price or 0 if not found
 */
export async function getCurrentPrice(
  symbol: string,
  exchange: 'NSE' | 'BSE' = 'NSE'
): Promise<number> {
  const prices = await getCurrentPrices([symbol], exchange);
  return prices[symbol] || 0;
}

/**
 * Get detailed quote information for a symbol
 * @param symbol Stock symbol
 * @param exchange Exchange to use
 * @returns Detailed quote data
 */
export async function getQuote(
  symbol: string,
  exchange: 'NSE' | 'BSE' = 'NSE'
): Promise<any> {
  try {
    const formattedSymbol = formatSymbolForYahoo(symbol, exchange);
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${formattedSymbol}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://finance.yahoo.com',
        'Origin': 'https://finance.yahoo.com',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data: YahooFinanceResponse = await response.json();

    if (data.quoteResponse?.result && data.quoteResponse.result.length > 0) {
      return data.quoteResponse.result[0];
    }

    return null;
  } catch (error: any) {
    console.error(`[YahooFinance] Error fetching quote for ${symbol}:`, error.message);
    return null;
  }
}

/**
 * Validate if a symbol exists on Yahoo Finance
 * @param symbol Stock symbol
 * @param exchange Exchange to use
 * @returns true if symbol exists
 */
export async function validateSymbol(
  symbol: string,
  exchange: 'NSE' | 'BSE' = 'NSE'
): Promise<boolean> {
  try {
    const quote = await getQuote(symbol, exchange);
    return quote !== null && quote.regularMarketPrice !== undefined;
  } catch {
    return false;
  }
}

