# Live Trading Setup Guide

## Overview

This guide explains how to set up **Live Trading** (Zerodha API) integration for real-time holdings and market prices.

## What's Been Fixed

### ✅ 1. Tradebook - Active Holdings by Default
- Tradebook now shows **Active Holdings** by default instead of "All"
- Easier to see current positions at a glance
- Can still switch to "All" or "Sold" using the filter

### ✅ 2. Live Market Prices via Zerodha Kite MCP
- Manual Portfolio (Tradebook/Holdings) now fetches **live prices** from Zerodha
- Uses Kite Connect API's `getLTP()` method
- Prices update in real-time for your CSV-imported trades
- Falls back to 0 if API not connected (won't break the app)

### ✅ 3. Multi-Account Support Architecture
The system supports 3 Zerodha accounts with consolidated and individual views, just like manual uploads.

## Live Trading Requirements

To use the **Live Trading** section, you need:

### 1. Zerodha Kite Connect App
- Sign up at: https://developers.kite.trade/
- Create an app
- Get your **API Key** and **API Secret**

### 2. Configure Accounts in `.env.local`

Create/update `kite-client-app/.env.local`:

```bash
# Account 1
KITE_ACC_1_ID=account1
KITE_ACC_1_NAME=Chandan
KITE_ACC_1_KEY=your_api_key_here
KITE_ACC_1_SECRET=your_api_secret_here

# Account 2
KITE_ACC_2_ID=account2
KITE_ACC_2_NAME=Family Member 2
KITE_ACC_2_KEY=their_api_key_here
KITE_ACC_2_SECRET=their_api_secret_here

# Account 3
KITE_ACC_3_ID=account3
KITE_ACC_3_NAME=Family Member 3
KITE_ACC_3_KEY=their_api_key_here
KITE_ACC_3_SECRET=their_api_secret_here
```

### 3. Authenticate Each Account

For each account, you need to complete the OAuth flow:

#### Step 1: Generate Login URL
```bash
curl -X POST http://localhost:3000/api/kite/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "login",
    "args": {
      "client_id": "account1"
    }
  }'
```

Response will contain a `loginUrl` - open it in browser.

#### Step 2: Authorize & Get Request Token
- Click the login URL
- Log in to Zerodha
- Authorize the app
- You'll be redirected to a URL like: `https://yourapp.com?request_token=XXXXX&status=success`
- Copy the `request_token` from the URL

#### Step 3: Generate Session
```bash
curl -X POST http://localhost:3000/api/kite/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "generate_session",
    "args": {
      "client_id": "account1",
      "request_token": "PASTE_REQUEST_TOKEN_HERE"
    }
  }'
```

#### Step 4: Repeat for All Accounts
Repeat steps 1-3 for `account2` and `account3`.

### 4. Credentials Storage
- Access tokens are saved in: `~/.kite-mcp-credentials.json`
- They persist across server restarts
- Tokens expire daily - need to re-authenticate

## How It Works

### Live Market Prices

When you view your manual portfolio (CSV data):

```javascript
// System automatically fetches live prices
Holdings → API calls Kite → getLTP(["NSE:INFY", "NSE:RELIANCE"]) 
         → Returns: { "NSE:INFY": { "last_price": 1500.50 }, ... }
         → Calculates current value & unrealized P&L
```

**Benefits**:
- ✅ Your CSV trades get real-time valuation
- ✅ See live unrealized P&L
- ✅ Current prices update automatically
- ✅ Works even if you don't use Live Trading section

### Live Trading Dashboard

Once authenticated, the Live Trading section shows:

**Consolidated View** (All 3 Accounts):
- Total investment across all accounts
- Combined current value
- Aggregated P&L
- Holdings count

**Individual View** (Per Account):
- Switch between accounts
- See each account's holdings separately
- Individual P&L tracking

**Data Flow**:
```
Dashboard → useKiteStore → /api/kite/execute 
         → kite-service (get_holdings, get_positions)
         → Zerodha API → Real-time data
```

## Current Status

### ✅ What's Working:
1. **Manual Portfolio (CSV)**:
   - ✅ Import tradebook/ledger
   - ✅ Calculate P&L from trades
   - ✅ Fetch live prices for current value
   - ✅ Show active/sold positions
   - ✅ Inline editing
   - ✅ Bulk operations

2. **Live Price Integration**:
   - ✅ Fetches from Zerodha Kite API
   - ✅ Updates Holdings page
   - ✅ Updates Dashboard analytics
   - ✅ Graceful fallback if API unavailable

3. **Multi-Account Architecture**:
   - ✅ Supports 3 accounts
   - ✅ Consolidated views
   - ✅ Individual account selection
   - ✅ Separate authentication per account

### ⚠️ What Needs Authentication:

**Live Trading Section** requires:
- Kite Connect API credentials (in `.env.local`)
- Daily OAuth authentication for each account
- Active internet connection

**Without Authentication**:
- Manual Portfolio still works
- CSV import/editing works
- P&L calculations work
- But live prices will show as 0

## Troubleshooting

### Issue: Live Prices Showing as 0

**Cause**: Kite API not authenticated or no active session

**Solution**:
1. Check if `.env.local` has API credentials
2. Complete OAuth flow for at least one account
3. Check `~/.kite-mcp-credentials.json` exists
4. Try re-authenticating

### Issue: Live Trading Shows "No Data"

**Causes**:
1. No accounts authenticated
2. Access tokens expired (daily)
3. API credentials missing

**Solution**:
```bash
# Check available accounts
curl http://localhost:3000/api/kite/accounts

# Should return:
{
  "accounts": [
    { "id": "account1", "name": "Chandan" },
    { "id": "account2", "name": "Family Member 2" },
    { "id": "account3", "name": "Family Member 3" }
  ]
}

# If empty, add to .env.local and restart
ddev exec "supervisorctl restart webextradaemons:nextjs"
```

### Issue: "Not authenticated" Error

**Solution**: Complete the 3-step OAuth flow for that account.

### Issue: Token Expired

**Symptom**: Was working yesterday, not working today

**Solution**: 
- Kite tokens expire daily
- Re-run Step 1-3 of authentication
- Consider automating with a script

## Architecture

### Two Parallel Systems

**1. Manual Portfolio (CSV-based)**:
```
CSV Import → MySQL Database → /api/stats → Dashboard/Holdings
             ↓
          Live Prices (via Kite API)
```

**2. Live Trading (API-based)**:
```
Zerodha API → kite-service → useKiteStore → Dashboard (Live Section)
```

**Integration Point**: Live prices API is shared for CSV data valuation.

### Data Sources

| Feature | Data Source | Requires Auth |
|---------|-------------|---------------|
| Tradebook | MySQL (CSV) | No |
| Holdings (CSV) | MySQL + Live Prices | Optional |
| Holdings (Live) | Zerodha API | Yes |
| Positions | Zerodha API | Yes |
| Orders | Zerodha API | Yes |
| Live Prices | Zerodha API | Yes |

## Benefits of Hybrid Approach

### Why Keep Both Systems?

**Manual Portfolio (CSV)**:
- ✅ Historical data (years of trades)
- ✅ Multiple brokers (not just Zerodha)
- ✅ Custom data entry
- ✅ Offline access to calculations
- ✅ Full edit control

**Live Trading**:
- ✅ Real-time holdings
- ✅ Current positions
- ✅ Live order book
- ✅ Today's P&L
- ✅ Intraday tracking

**Combined**:
- ✅ Historical performance + Live valuation
- ✅ Long-term XIRR + Today's P&L
- ✅ All brokers + Live Zerodha
- ✅ Complete picture!

## Next Steps

### To Enable Full Live Trading:

1. **Get Kite API Credentials**:
   - Visit https://developers.kite.trade/
   - Sign up and create an app
   - Note down API Key and Secret

2. **Configure Accounts**:
   - Add to `kite-client-app/.env.local`
   - Use the format shown above
   - One set of credentials per account

3. **Authenticate**:
   - Use the curl commands above
   - Or build a UI for it (future enhancement)
   - Do this daily (tokens expire)

4. **Enjoy**:
   - Live Trading section will populate
   - CSV data gets live prices
   - Full portfolio visibility!

### Future Enhancements

**Planned**:
- [ ] Auto-refresh tokens (using refresh token)
- [ ] UI for authentication (no curl needed)
- [ ] Token expiry notifications
- [ ] Automatic daily re-auth
- [ ] More exchanges (BSE live prices)

## Files Modified

### Backend:
- `kite-client-app/app/api/stats/route.ts` - Added live price fetching
- `kite-client-app/lib/kite-service.ts` - Already had multi-account support

### Frontend:
- `kite-client-app/app/tradebook/page.tsx` - Default to active holdings
- `kite-client-app/app/dashboard/page.tsx` - Shows both systems

### Documentation:
- `docs/LIVE_TRADING_SETUP.md` - This guide

---

**Status**: ✅ All fixes complete, authentication required for live trading
**Date**: 2025-11-29
**Version**: 2.0

The system is ready for live trading - just needs Kite API credentials and daily authentication!

