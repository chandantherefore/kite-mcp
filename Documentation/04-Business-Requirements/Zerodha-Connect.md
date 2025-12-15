# Zerodha Connect

## Feature Description

Integration with Zerodha Kite Connect API for live trading data, account management, and order execution.

## User Stories

- **As a User**, I want to add my Zerodha account so that I can access live data.
- **As a User**, I want to authenticate with Zerodha so that I can fetch my holdings and positions.
- **As a User**, I want to see my live holdings so that I can track current portfolio value.
- **As a User**, I want to place orders via MCP so that AI assistants can help with trading.

## Technical Implementation

### Account Addition

**Location**: Settings > Accounts

**Process**:
1. User creates account via `/api/accounts` (POST)
2. User adds API key and secret via account settings
3. Credentials stored in `accounts` table (api_key, api_secret)
4. Account ready for authentication

**Database**: `accounts` table stores credentials per user

### Authentication Flow

**API Route**: `POST /api/kite/auth`

**Steps**:
1. **Login** (`action=login`):
   - Load API credentials from database
   - Generate login URL via KiteConnect
   - Return URL to user

2. **Generate Session** (`action=session`):
   - User authorizes on Zerodha website
   - User provides request_token
   - Generate access_token via KiteConnect
   - Save access_token to database
   - Cache session in memory

**Session Management**:
- In-memory cache (Map<accountId, KiteSession>)
- Database persistence (accounts.access_token)
- Lazy loading from database

### Live Data Display

**API Route**: `POST /api/kite/execute`

**Supported Tools**:
- `get_holdings` - Current holdings
- `get_positions` - Open positions
- `get_margins` - Available margins
- `get_profile` - User profile
- `get_orders` - Order history
- `get_quotes` - Market quotes
- `get_ohlc` - OHLC data
- `place_order` - Place order
- `modify_order` - Modify order
- `cancel_order` - Cancel order

**Usage**:
```typescript
POST /api/kite/execute
{
  "tool": "get_holdings",
  "args": {
    "account_id": 1
  }
}
```

### MCP Server Integration

**Location**: `src/index.ts` (MCP Server)

**Purpose**: AI assistants can interact with Kite API via MCP protocol

**Tools**: Same as above, accessible via MCP stdio interface

**Multi-Account Support**: MCP server supports multiple accounts via environment variables

## Database Tables

- `accounts` - Stores API credentials and access tokens

## Files

- `equity/lib/kite-service.ts` - Kite service wrapper
- `equity/app/api/kite/auth/route.ts` - Authentication
- `equity/app/api/kite/execute/route.ts` - Tool execution
- `equity/app/api/kite/accounts/route.ts` - Account listing
- `equity/app/settings/accounts/page.tsx` - Account management UI
- `src/index.ts` - MCP server implementation

## Security

- Credentials stored in database (encrypted at rest)
- Access tokens expire at end of trading day
- User-scoped account access
- No credentials in client-side code

