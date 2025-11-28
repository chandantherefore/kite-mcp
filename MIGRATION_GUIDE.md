# Migration Guide: Single to Multi-Account

This guide helps you migrate from the old single-account setup to the new multi-account system.

## What Changed?

### Before (Single Account)
- One API key/secret hardcoded or in single env vars
- Direct `getHoldings()` calls
- Single KiteConnect instance
- No `client_id` parameter

### After (Multi-Account)
- Multiple accounts via numbered env vars
- `getHoldings({ client_id: "..." })` calls
- Map of KiteConnect instances per account
- Mandatory or optional `client_id` parameter

## Breaking Changes

### 1. MCP Tool Signatures

All data-fetching tools now accept an optional `client_id` parameter:

**Old:**
```typescript
await mcp.callTool('get_holdings', {});
```

**New:**
```typescript
await mcp.callTool('get_holdings', { client_id: 'father' });
```

**Backward Compatibility:**
If you have **only one account** configured, `client_id` is optional and will default to that account.

### 2. Login Flow

**Old:**
```typescript
await mcp.callTool('login', {
  api_key: 'xxx',
  api_secret: 'yyy'
});
```

**New:**
```typescript
await mcp.callTool('login', {
  client_id: 'father',
  api_key: 'xxx',    // Optional if in env
  api_secret: 'yyy'  // Optional if in env
});
```

### 3. Credentials Storage

**Old Format (`~/.kite-mcp-credentials.json`):**
```json
{
  "api_key": "xxx",
  "api_secret": "yyy",
  "access_token": "zzz"
}
```

**New Format:**
```json
{
  "father": {
    "api_key": "xxx",
    "api_secret": "yyy",
    "access_token": "zzz"
  },
  "mother": {
    "api_key": "aaa",
    "api_secret": "bbb",
    "access_token": "ccc"
  }
}
```

**Migration:** Delete the old credentials file and re-authenticate all accounts.

## Step-by-Step Migration

### Step 1: Update Environment Variables

**Old `.env.local`:**
```bash
KITE_API_KEY=xxx
KITE_API_SECRET=yyy
```

**New `.env.local`:**
```bash
KITE_ACC_1_ID=primary
KITE_ACC_1_NAME=My Account
KITE_ACC_1_KEY=xxx
KITE_ACC_1_SECRET=yyy
```

### Step 2: Rebuild the Project

```bash
npm run build
```

### Step 3: Re-authenticate

Delete old credentials and login again:

```bash
rm ~/.kite-mcp-credentials.json
```

Then use the login flow with `client_id`:

```
Tool: login
Args: { client_id: "primary" }
```

### Step 4: Update Code (if using programmatically)

**Old API calls:**
```typescript
const holdings = await fetch('/api/kite/execute', {
  method: 'POST',
  body: JSON.stringify({ tool: 'get_holdings' })
});
```

**New API calls:**
```typescript
const holdings = await fetch('/api/kite/execute', {
  method: 'POST',
  body: JSON.stringify({ 
    tool: 'get_holdings',
    args: { client_id: 'primary' }  // Can omit if only one account
  })
});
```

### Step 5: Update UI Components

If you have custom UI components using `useKiteStore`:

**Old:**
```typescript
const { holdings, fetchData } = useKiteStore();

useEffect(() => {
  fetchData();
}, []);
```

**New:**
```typescript
const { consolidated, fetchAllAccountsData } = useKiteStore();

useEffect(() => {
  fetchAllAccountsData();
}, []);

// Access consolidated data
console.log(consolidated.holdings);
console.log(consolidated.totalPnL);
```

## Testing the Migration

### 1. Test Single Account (Backward Compatibility)

Configure only one account and test without `client_id`:

```bash
# .env.local
KITE_ACC_1_ID=main
KITE_ACC_1_NAME=Main Account
KITE_ACC_1_KEY=xxx
KITE_ACC_1_SECRET=yyy
```

```typescript
// Should work without client_id
await mcp.callTool('get_holdings', {});
```

### 2. Test Multiple Accounts

Add a second account and test with explicit `client_id`:

```bash
# .env.local
KITE_ACC_1_ID=acc1
KITE_ACC_1_NAME=Account 1
KITE_ACC_1_KEY=xxx
KITE_ACC_1_SECRET=yyy

KITE_ACC_2_ID=acc2
KITE_ACC_2_NAME=Account 2
KITE_ACC_2_KEY=aaa
KITE_ACC_2_SECRET=bbb
```

```typescript
// Must specify client_id now
await mcp.callTool('get_holdings', { client_id: 'acc1' });
await mcp.callTool('get_holdings', { client_id: 'acc2' });
```

### 3. Test Consolidated View

Visit `http://localhost:3000/portfolio` to see the consolidated dashboard.

## Rollback Plan

If you need to rollback to the old single-account system:

1. **Restore old code:**
   ```bash
   git checkout <previous-commit>
   ```

2. **Restore old env format:**
   ```bash
   # .env.local
   KITE_API_KEY=xxx
   KITE_API_SECRET=yyy
   ```

3. **Restore old credentials:**
   ```bash
   # ~/.kite-mcp-credentials.json
   {
     "api_key": "xxx",
     "access_token": "zzz"
   }
   ```

## Common Issues

### Error: "Multiple accounts available. Please specify client_id"

**Cause:** You have multiple accounts but didn't provide `client_id`.

**Fix:** Either specify `client_id` or configure only one account.

### Error: "Cannot find API credentials for client_id 'X'"

**Cause:** The `client_id` doesn't match any configured account ID in `.env.local`.

**Fix:** Check your `.env.local` and ensure `KITE_ACC_N_ID` matches the `client_id` you're using.

### Holdings/P&L not showing

**Cause:** Authentication might have failed silently for some accounts.

**Fix:** Check browser console for errors. Re-authenticate accounts individually.

## Need Help?

- Review [MULTI_ACCOUNT_SETUP.md](./MULTI_ACCOUNT_SETUP.md) for detailed configuration
- Check [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) for API examples
- File an issue on GitHub with error logs

## Next Steps

After successful migration:
1. Test all accounts authenticate correctly
2. Verify consolidated dashboard shows correct data
3. Test P/L calculations are accurate
4. Update any custom integrations or scripts
5. Document your account IDs for team members

