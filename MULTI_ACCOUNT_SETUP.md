# Multi-Account Kite Setup Guide

This guide explains how to configure and use multiple Kite accounts for a consolidated family portfolio dashboard.

## Overview

The system now supports:
- Multiple Kite accounts (via different API apps)
- Consolidated portfolio view across all accounts
- Per-account authentication and data fetching
- Proper P/L calculation with weighted averages
- Mutual fund holdings alongside equity holdings

## Configuration

### 1. Environment Variables

Copy `env.example` to `.env.local` in the project root:

```bash
cp env.example .env.local
```

Edit `.env.local` and configure your accounts:

```bash
# Account 1
KITE_ACC_1_ID=father
KITE_ACC_1_NAME=Dad's Portfolio
KITE_ACC_1_KEY=your_kite_api_key
KITE_ACC_1_SECRET=your_kite_api_secret

# Account 2
KITE_ACC_2_ID=mother
KITE_ACC_2_NAME=Mom's Portfolio
KITE_ACC_2_KEY=another_api_key
KITE_ACC_2_SECRET=another_api_secret

# Add more accounts as needed...
```

**Important Notes:**
- `ID` must be unique and alphanumeric (e.g., "father", "mother", "son1")
- `NAME` is the display name shown in the UI
- Each account needs its own Kite Connect API app with separate keys
- Accounts are auto-discovered by incrementing numbers (1, 2, 3, ...)

### 2. Build the MCP Server

After configuring accounts, rebuild the MCP server:

```bash
npm run build
```

## Authentication Flow

### For MCP/Chatbot Usage

When using the MCP tools (e.g., via Claude Desktop), you must specify `client_id`:

```
1. List available accounts:
   Tool: list_accounts
   
2. Login to a specific account:
   Tool: login
   Args: { client_id: "father" }
   
3. After getting the login URL, authorize and get the request_token
   
4. Generate session:
   Tool: generate_session
   Args: { client_id: "father", request_token: "..." }
   
5. Fetch data for that account:
   Tool: get_holdings
   Args: { client_id: "father" }
```

**Chatbot Best Practices:**
- Always ask the user which account they want to work with
- Use `list_accounts` to show available options
- Keep track of the selected `client_id` in the conversation context
- Pass `client_id` to all data-fetching and order-placement tools

### For Web Dashboard

The web dashboard automatically authenticates all configured accounts and displays consolidated data.

## Features

### 1. Consolidated Portfolio View

Access at: `http://localhost:3000/portfolio`

**Features:**
- Summary cards showing total investment, current value, P/L, and returns
- Consolidated equity holdings table
- Consolidated mutual fund holdings table
- Expandable rows to see per-account breakdown
- Properly calculated weighted average prices

### 2. Per-Account View

The existing holdings/positions pages can be extended to show data for a specific account by passing `client_id`.

### 3. P/L Calculation

The system now **calculates P/L client-side** to ensure accuracy:

```typescript
Investment Value = Quantity × Average Price
Current Value = Quantity × Last Price (LTP)
P/L = Current Value - Investment Value
P/L % = (P/L / Investment Value) × 100
```

For consolidated holdings, it uses **weighted average prices**:

```typescript
Weighted Avg Price = Σ(Quantity_i × Price_i) / Σ(Quantity_i)
```

## API Endpoints

### GET `/api/kite/accounts`
Returns list of configured accounts (ID and name only, no secrets).

### POST `/api/kite/execute`
Execute any Kite tool. Body:
```json
{
  "tool": "get_holdings",
  "args": {
    "client_id": "father"
  }
}
```

### POST `/api/kite/auth`
Handle login/session generation. Body:
```json
{
  "action": "login",
  "client_id": "father",
  "api_key": "optional_override",
  "api_secret": "optional_override"
}
```

## Data Models

### ConsolidatedHolding
```typescript
{
  tradingsymbol: string;
  exchange: string;
  totalQuantity: number;
  averagePrice: number;        // Weighted average
  currentPrice: number;
  currentValue: number;
  investmentValue: number;
  pnl: number;
  pnlPercentage: number;
  accounts: Array<{
    id: string;
    name: string;
    quantity: number;
    averagePrice: number;
    pnl: number;
  }>;
}
```

### ConsolidatedMFHolding
Similar structure for mutual funds with `fund` name and units instead of quantity.

## Troubleshooting

### "Multiple accounts available. Please specify client_id"
This means you have multiple accounts configured but didn't provide a `client_id` parameter. Either:
- Specify the `client_id` explicitly
- Configure only one account (for backward compatibility)

### "Not authenticated for client_id 'X'"
You need to login first for that account. Call the `login` tool followed by `generate_session`.

### P/L showing as zero
The Kite API sometimes returns `pnl: 0`. Our system now **calculates it explicitly** using:
- `average_price` from holdings
- `last_price` (LTP)
- `quantity`

If P/L is still zero, check:
- Is `average_price` non-zero?
- Is `last_price` updated? (Market hours vs after-hours)
- Are you looking at the right field? (We use `pnl`, not `day_change`)

### Credentials not persisting
Credentials are stored in `~/.kite-mcp-credentials.json` as a map:
```json
{
  "father": { "api_key": "...", "access_token": "..." },
  "mother": { "api_key": "...", "access_token": "..." }
}
```

If sessions expire, re-run the login flow for each account.

## Security Notes

- API keys and secrets are stored in `.env.local` (never commit this file)
- Access tokens are stored in `~/.kite-mcp-credentials.json`
- The web API does not expose secrets, only account IDs/names
- Each account uses separate Kite Connect apps for isolation

## Adding/Removing Accounts

### To Add an Account:
1. Create a new Kite Connect app at https://developers.kite.trade/
2. Add the new account to `.env.local` with the next number
3. Rebuild: `npm run build`
4. Restart the MCP server or Next.js app
5. Authenticate the new account via login flow

### To Remove an Account:
1. Remove or comment out the account lines in `.env.local`
2. Rebuild: `npm run build`
3. Restart the server
4. Optionally, clean up the credentials file

## Future Enhancements

Potential improvements:
- Real-time WebSocket updates for prices
- Sector/asset-class breakdown
- Realized vs unrealized P/L separation
- Performance analytics and charts
- Tax harvesting suggestions
- Alert system for price targets

