import { NextResponse } from 'next/server';
import { getCurrentPrices, getCurrentPrice, getQuote } from '@/lib/yahoo-finance';

/**
 * Test endpoint for Yahoo Finance integration
 * GET /api/test-prices
 * 
 * This endpoint tests the Yahoo Finance service with common Indian stocks
 */
export async function GET() {
  try {
    console.log('[TestPrices] Starting Yahoo Finance test...');
    
    // Test with popular Indian stocks
    const testSymbols = [
      'RELIANCE',
      'TCS',
      'INFY',
      'HDFCBANK',
      'ICICIBANK',
      'SBIN',
      'BHARTIARTL',
      'ITC',
      'KOTAKBANK',
      'LT'
    ];
    
    // Fetch all prices at once
    const startTime = Date.now();
    const prices = await getCurrentPrices(testSymbols, 'NSE');
    const fetchTime = Date.now() - startTime;
    
    console.log('[TestPrices] Fetched prices in', fetchTime, 'ms');
    
    // Get detailed quote for one symbol
    const detailedQuote = await getQuote('RELIANCE', 'NSE');
    
    // Count successful fetches
    const successCount = Object.values(prices).filter(p => p > 0).length;
    const failedSymbols = Object.entries(prices)
      .filter(([_, price]) => price === 0)
      .map(([symbol, _]) => symbol);
    
    // Format response
    const result = {
      success: true,
      message: 'Yahoo Finance test completed',
      stats: {
        totalSymbols: testSymbols.length,
        successfulFetches: successCount,
        failedFetches: failedSymbols.length,
        fetchTimeMs: fetchTime,
        avgTimePerSymbol: Math.round(fetchTime / testSymbols.length),
      },
      prices,
      failedSymbols,
      detailedQuoteExample: detailedQuote ? {
        symbol: detailedQuote.symbol,
        currentPrice: detailedQuote.regularMarketPrice,
        previousClose: detailedQuote.regularMarketPreviousClose,
        dayHigh: detailedQuote.regularMarketDayHigh,
        dayLow: detailedQuote.regularMarketDayLow,
        volume: detailedQuote.regularMarketVolume,
      } : null,
      timestamp: new Date().toISOString(),
    };
    
    console.log('[TestPrices] Test results:', result.stats);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('[TestPrices] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to test Yahoo Finance',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

