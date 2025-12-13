# Live Prices Setup

## Overview
The Tradebook page fetches live market prices from Zerodha Kite API to calculate current portfolio value and unrealized P&L. For this to work, you need to:

1. Authenticate at least one Kite account
2. Link your database accounts to authenticated Kite accounts

## Authentication Steps

### 1. Authenticate a Kite Account
You need to authenticate at least one Kite account through the MCP server or the Web App's Kite auth flow.

**Via MCP Server (recommended):**
```bash
# From the MCP server (in Claude Desktop or similar)
# Call the login tool with your client_id (e.g., "chandan", "father", "mother")
login(client_id="chandan")

# Follow the authorization URL
# Then call generate_session with the request_token
generate_session(client_id="chandan", request_token="...")
```

This saves the credentials to `~/.oneapp-credentials.json`.

### 2. Link Database Accounts to Kite Accounts

Update the `broker_id` field in your `accounts` table to match the `client_id` used for authentication:

```sql
-- Example: Link account ID 1 to the "chandan" Kite client
UPDATE accounts SET broker_id = 'chandan' WHERE id = 1;

-- Link account ID 2 to "father" Kite client
UPDATE accounts SET broker_id = 'father' WHERE id = 2;
```

## How It Works

1. **Single Account View**: When viewing a specific account's tradebook, the API uses that account's `broker_id` to fetch live prices from the corresponding authenticated Kite session.

2. **Consolidated View**: When viewing all accounts, the API will:
   - Try to use any authenticated session if only one exists
   - If multiple sessions exist but no specific account is selected, it may fail with "Multiple accounts available" error

## Troubleshooting

### "N/A" shown for current prices

**Cause**: No authenticated Kite session available, or the session has expired.

**Solution**:
1. Check if credentials exist: `cat ~/.oneapp-credentials.json`
2. Verify the session is valid (access tokens expire daily)
3. Re-authenticate using the login flow
4. Ensure the `broker_id` in your database matches the authenticated `client_id`

### "Multiple accounts available" error

**Cause**: Multiple Kite sessions are authenticated, but the system doesn't know which one to use.

**Solution**:
1. Set the `broker_id` field for each account in your database
2. Or filter by a specific account when viewing the tradebook

### Session Expired

Kite Connect access tokens expire at the end of each trading day. You need to re-authenticate daily:
```bash
# Get a new request token and generate a new session
login(client_id="chandan")
# Follow the URL and get request_token
generate_session(client_id="chandan", request_token="...")
```

