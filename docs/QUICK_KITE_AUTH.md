# Quick Kite Authentication Guide

## Why Live Trading Shows "No Data"

The Live Trading section requires **active authentication** with Zerodha Kite Connect API. Without it, you'll see "No live trading data available".

## Easy Setup (New UI Method)

### Step 1: Configure API Credentials

Create/update `kite-client-app/.env.local`:

```bash
# Account 1
KITE_ACC_1_ID=account1
KITE_ACC_1_NAME=Chandan
KITE_ACC_1_KEY=your_api_key_here
KITE_ACC_1_SECRET=your_api_secret_here

# Account 2 (optional)
KITE_ACC_2_ID=account2
KITE_ACC_2_NAME=Family Member 2
KITE_ACC_2_KEY=their_api_key
KITE_ACC_2_SECRET=their_secret

# Account 3 (optional)
KITE_ACC_3_ID=account3
KITE_ACC_3_NAME=Family Member 3
KITE_ACC_3_KEY=their_api_key
KITE_ACC_3_SECRET=their_secret
```

**Get API Credentials**: https://developers.kite.trade/

### Step 2: Restart Server

```bash
ddev exec "supervisorctl restart webextradaemons:nextjs"
```

### Step 3: Authenticate via UI

1. Go to **https://oneapp.ddev.site:3003/kite-auth**
2. You'll see all configured accounts
3. Click **"Authenticate"** for each account
4. You'll be redirected to Zerodha
5. Log in and authorize
6. You'll be automatically redirected back
7. Account status will change to "✓ Authenticated"

### Step 4: View Live Data

Go back to **Dashboard** → Live Trading section will now show data!

## What You'll Get

Once authenticated:

✅ **Live Trading Section**:
- Real-time holdings from Zerodha
- Current positions
- Live P&L
- Multi-account consolidation

✅ **Live Prices for CSV Data**:
- Your manual portfolio gets real-time prices
- Accurate current valuations
- Live unrealized P&L

## Daily Re-authentication

⚠️ **Important**: Kite tokens expire every day

**Solution**: Just revisit `/kite-auth` and click "Re-authenticate" for each account. Takes 30 seconds!

## Troubleshooting

### "No Kite accounts configured"

**Fix**: Add credentials to `.env.local` and restart server

### Authentication fails

**Possible causes**:
1. Wrong API credentials
2. App not published on Kite Connect
3. Redirect URL not configured

**Fix**: Check your Kite Connect app settings

### Shows "No data" even after auth

**Fix**: 
1. Refresh the dashboard page
2. Check `/kite-auth` - make sure status shows "✓ Authenticated"
3. Check browser console for errors

## Quick Links

- **Auth Page**: https://oneapp.ddev.site:3003/kite-auth
- **Dashboard**: https://oneapp.ddev.site:3003/dashboard
- **Kite Developers**: https://developers.kite.trade/

---

That's it! Much easier than curl commands. Just click "Authenticate" and you're done! 🎉

