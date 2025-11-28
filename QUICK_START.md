# Quick Start Guide

## 🎉 Implementation Complete!

Your multi-account Kite portfolio system is ready. Here's how to get started:

## 1. Configure Accounts

Create a `.env.local` file in the project root (copy from `env.example`):

```bash
# Account 1
KITE_ACC_1_ID=father
KITE_ACC_1_NAME=Dad's Portfolio
KITE_ACC_1_KEY=your_kite_api_key_here
KITE_ACC_1_SECRET=your_kite_api_secret_here

# Account 2
KITE_ACC_2_ID=mother
KITE_ACC_2_NAME=Mom's Portfolio
KITE_ACC_2_KEY=another_api_key
KITE_ACC_2_SECRET=another_api_secret

# Add more accounts as needed...
```

**Important:** Each account must use a different Kite Connect API app with separate API keys.

## 2. Build the MCP Server

```bash
npm run build
```

## 3. Authenticate Accounts

### Option A: Via MCP/Claude Desktop

1. Open Claude Desktop with MCP configured
2. List available accounts:
   ```
   Tool: list_accounts
   ```

3. For each account, login:
   ```
   Tool: login
   Args: { client_id: "father" }
   ```

4. Click the returned login URL and authorize

5. Generate session with the request_token from redirect:
   ```
   Tool: generate_session
   Args: { client_id: "father", request_token: "..." }
   ```

### Option B: Via API

Use the `/api/kite/auth` endpoint with POST requests (see API documentation).

## 4. Run the Web Dashboard

```bash
cd kite-client-app
npm install
npm run dev
```

Open `http://localhost:3000`

The web dashboard now uses the KiteConnect SDK directly in API routes for seamless integration!

## 5. View Your Portfolio

Navigate to:
- `/dashboard` - Overview with summary cards
- `/portfolio` - Consolidated holdings and mutual funds with P&L

## What You Get

### ✅ Multi-Account Support
- Configure unlimited accounts via environment variables
- Independent authentication per account
- Consolidated view across all accounts

### ✅ Consolidated Portfolio Dashboard
- **Summary Cards**: Total Investment, Current Value, Total P&L, Returns %
- **Equity Holdings Table**: Grouped by symbol with per-account breakdown
- **Mutual Fund Holdings Table**: Grouped by scheme with per-account breakdown
- **Expandable Rows**: Click to see which account holds what

### ✅ Proper P/L Calculation
- Fixed the "P/L = 0" issue
- Client-side calculation: `P/L = (Qty × LTP) - (Qty × Avg Price)`
- Weighted average prices for consolidated view
- Accurate percentage returns

### ✅ Chatbot Integration
- All MCP tools support `client_id` parameter
- `list_accounts` tool to show available accounts
- Smart error messages when `client_id` is ambiguous
- Backward compatible: single account works without `client_id`

## Example Usage

### Chatbot Conversation

```
User: Show me my portfolio
Bot: I see 2 accounts configured: father, mother. Which one?
User: father
Bot: [calls get_holdings({ client_id: "father" })]
     Here are Dad's Portfolio holdings:
     - RELIANCE: 10 shares @ ₹2,500 (avg)
     - TCS: 5 shares @ ₹3,200 (avg)
     Total P&L: +₹15,000
```

### Web Dashboard

1. Dashboard shows consolidated summary
2. Click "Consolidated Portfolio"
3. See all holdings grouped by symbol
4. Click row count (e.g., "2 ▼") to expand
5. View per-account breakdown with individual P&L

## Troubleshooting

### "Multiple accounts available. Please specify client_id"
- You have multiple accounts configured
- Either specify `client_id` in the tool call OR configure only one account

### P/L still showing zero
- Check that `average_price` is non-zero in holdings
- Ensure market hours for live `last_price` updates
- Our calculation uses: `(quantity × last_price) - (quantity × average_price)`

### Authentication not persisting
- Credentials stored in `~/.kite-mcp-credentials.json`
- Delete this file and re-authenticate if issues persist

### Account not showing
- Verify `.env.local` has correct format: `KITE_ACC_N_ID`, `KITE_ACC_N_NAME`, etc.
- Rebuild after changing env: `npm run build`
- Check account appears in `list_accounts` tool response

## Next Steps

1. **Test the system:**
   - Configure at least 2 accounts
   - Authenticate both
   - View consolidated portfolio

2. **Customize:**
   - Update account names in `.env.local`
   - Add more accounts as needed
   - Modify UI colors/layout in `portfolio/page.tsx`

3. **Integrate chatbot:**
   - Configure Claude Desktop MCP
   - Test multi-account conversations
   - Use `client_id` parameter consistently

## Documentation

- **[MULTI_ACCOUNT_SETUP.md](./MULTI_ACCOUNT_SETUP.md)** - Complete setup guide
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migrating from single account
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Technical details
- **[USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)** - API examples

## Key Files

### Backend/MCP
- `src/config.ts` - Configuration loader
- `src/index.ts` - Multi-account MCP server

### Frontend
- `kite-client-app/store/useKiteStore.ts` - State management
- `kite-client-app/app/portfolio/page.tsx` - Consolidated dashboard
- `kite-client-app/app/api/kite/` - API routes

### Configuration
- `env.example` - Environment template
- `.env.local` - Your actual config (create this)
- `~/.kite-mcp-credentials.json` - Stored tokens

## Support

- Issues? Check `MULTI_ACCOUNT_SETUP.md` troubleshooting section
- Questions? See `IMPLEMENTATION_SUMMARY.md` for architecture details
- Bugs? File an issue on GitHub with logs

## What's Different from Before?

### Old (Single Account)
```typescript
// MCP
get_holdings({})

// Store
const { holdings, fetchData } = useKiteStore();
```

### New (Multi-Account)
```typescript
// MCP
get_holdings({ client_id: "father" })
// OR omit client_id if only one account

// Store
const { consolidated, fetchAllAccountsData } = useKiteStore();
// consolidated.holdings = aggregated view
// consolidated.totalPnL = family-wide P/L
```

## Success Checklist

- [ ] `.env.local` configured with all accounts
- [ ] MCP server built successfully (`npm run build`)
- [ ] All accounts authenticated (via MCP or API)
- [ ] Web dashboard running (`npm run dev`)
- [ ] Consolidated portfolio shows correct data
- [ ] P/L calculations look accurate
- [ ] Per-account breakdown expands correctly
- [ ] Chatbot responds to `list_accounts`

---

**You're all set!** 🚀 Your multi-account family portfolio system is ready to use.

For any questions or issues, refer to the detailed documentation files listed above.

