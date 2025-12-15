# Backend Architecture

## Overview

The backend consists of two main components:
1. **Next.js API Routes** - RESTful API for the web application
2. **MCP Server** - Standalone Model Context Protocol server

## Next.js API Architecture

### API Route Structure

**Location**: `equity/app/api/`

**Pattern**: Next.js App Router API routes using Route Handlers

**Authentication**: All routes (except public ones) require authentication via `getServerSession(authOptions)` or `requireAuth()`

### API Route Categories

#### 1. Authentication Routes

**Location**: `equity/app/api/auth/[...nextauth]/route.ts`

**Purpose**: NextAuth.js authentication endpoints

**Endpoints**:
- `GET /api/auth/signin` - Sign in page
- `POST /api/auth/signin` - Sign in handler
- `GET /api/auth/signout` - Sign out
- `GET /api/auth/callback/google` - Google OAuth callback
- `GET /api/auth/session` - Get current session

**Configuration**:
- **Strategy**: JWT (for credentials), Database (for OAuth)
- **Session Duration**: 30 days
- **Providers**: Credentials (email/password), Google OAuth
- **Callbacks**: `signIn`, `jwt`, `session`

#### 2. User Management Routes

**Location**: `equity/app/api/register/route.ts`, `equity/app/api/verify-email/route.ts`

**Endpoints**:
- `POST /api/register` - User registration
- `GET /api/verify-email?token=...` - Email verification

**Process**:
1. Validate input data
2. Hash password with bcrypt
3. Create user (is_active=false)
4. Generate verification token
5. Send verification email (if Resend configured)

#### 3. Account Management Routes

**Location**: `equity/app/api/accounts/route.ts`, `equity/app/api/accounts/[id]/route.ts`

**Endpoints**:
- `GET /api/accounts` - List all accounts for current user
- `POST /api/accounts` - Create new account
- `GET /api/accounts/[id]` - Get account details
- `PUT /api/accounts/[id]` - Update account
- `DELETE /api/accounts/[id]` - Delete account

**Security**: All operations are user-scoped via `requireAuth()` and account ownership validation

#### 4. Trade Management Routes

**Location**: `equity/app/api/trades/route.ts`, `equity/app/api/trades/[id]/route.ts`, `equity/app/api/trades/bulk-update/route.ts`

**Endpoints**:
- `GET /api/trades?accountId=...&symbol=...` - List trades
- `POST /api/trades` - Create trade
- `GET /api/trades/[id]` - Get trade
- `PUT /api/trades/[id]` - Update trade
- `DELETE /api/trades/[id]` - Delete trade
- `POST /api/trades/bulk-update` - Bulk update trades

**Data Access**: All queries filter by `user_id` through account ownership

#### 5. Tradebook Routes

**Location**: `equity/app/api/tradebook/route.ts`

**Endpoints**:
- `GET /api/tradebook?accountId=...` - Get tradebook with grouping and XIRR

**Features**:
- Groups trades by symbol
- Calculates holdings per symbol
- Fetches current prices (Yahoo Finance)
- Calculates XIRR per stock

#### 6. Ledger Routes

**Location**: `equity/app/api/ledger/route.ts`

**Endpoints**:
- `GET /api/ledger?accountId=...&fromDate=...&toDate=...` - Get ledger entries

**Features**:
- Date range filtering
- Account filtering
- User-scoped data access

#### 7. Import Routes

**Location**: `equity/app/api/import/tradebook/route.ts`, `equity/app/api/import/ledger/route.ts`

**Endpoints**:
- `POST /api/import/tradebook` - Import tradebook CSV
- `POST /api/import/ledger` - Import ledger CSV

**Process**:
1. Parse CSV file
2. Validate each record
3. Check for duplicates
4. Create conflicts for mismatches
5. Insert new records
6. Update account sync timestamps

#### 8. Conflict Management Routes

**Location**: `equity/app/api/conflicts/route.ts`, `equity/app/api/conflicts/[id]/route.ts`

**Endpoints**:
- `GET /api/conflicts?accountId=...&status=...` - List conflicts
- `GET /api/conflicts/[id]` - Get conflict details
- `PUT /api/conflicts/[id]` - Resolve conflict

**Resolution Strategies**:
- `resolved_keep_existing` - Keep current database record
- `resolved_use_new` - Replace with new data
- `resolved_manual` - Manual resolution
- `ignored` - Ignore conflict

#### 9. Kite Integration Routes

**Location**: `equity/app/api/kite/accounts/route.ts`, `equity/app/api/kite/auth/route.ts`, `equity/app/api/kite/execute/route.ts`

**Endpoints**:
- `GET /api/kite/accounts` - List Kite accounts with auth status
- `POST /api/kite/auth` - Initiate Kite authentication
- `POST /api/kite/execute` - Execute Kite tool

**Tools Supported**:
- Authentication: `login`, `generate_session`
- Market Data: `get_quotes`, `get_ltp`, `get_ohlc`
- Portfolio: `get_profile`, `get_margins`, `get_holdings`, `get_positions`, `get_mf_holdings`, `get_orders`
- Trading: `place_order`, `modify_order`, `cancel_order`

#### 10. Statistics Routes

**Location**: `equity/app/api/stats/route.ts`

**Endpoints**:
- `GET /api/stats?accountId=...` - Portfolio statistics

**Returns**:
- Total investment
- Current value
- Total P&L (realized + unrealized)
- XIRR (portfolio-level)
- Holdings with stock-level XIRR
- Holdings count

#### 11. Balance Sheet Routes

**Location**: `equity/app/api/balancesheet/`

**Endpoints**:
- `GET /api/balancesheet/banks` - List banks
- `POST /api/balancesheet/banks` - Create bank
- `GET /api/balancesheet/banks/[id]` - Get bank
- `PUT /api/balancesheet/banks/[id]` - Update bank
- `DELETE /api/balancesheet/banks/[id]` - Delete bank
- `GET /api/balancesheet/categories` - List categories
- `POST /api/balancesheet/categories` - Create category
- `GET /api/balancesheet/transactions` - List transactions
- `POST /api/balancesheet/transactions` - Create transaction
- `GET /api/balancesheet/recurring` - List recurring transactions
- `POST /api/balancesheet/recurring` - Create recurring transaction
- `GET /api/balancesheet/stats` - Balance sheet statistics
- `GET /api/balancesheet/upcoming-recurring` - Upcoming recurring transactions
- `GET /api/balancesheet/bank-projections` - Bank balance projections

#### 12. Tools Routes

**Location**: `equity/app/api/tools/split/route.ts`

**Endpoints**:
- `POST /api/tools/split` - Apply stock split to historical trades

#### 13. Admin Routes

**Location**: `equity/app/api/admin/users/route.ts`

**Endpoints**:
- `GET /api/admin/users` - List all users (admin only)
- `PATCH /api/admin/users` - Update user (role, active status)

## Database Layer

### Connection Management

**Location**: `equity/lib/db.ts`

**Configuration**:
```typescript
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'db',
  password: process.env.DATABASE_PASSWORD || 'db',
  database: process.env.DATABASE_NAME || 'oneapp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};
```

**Connection Pool**: Managed via `mysql2/promise` connection pool

### Database Helpers

**Equity Module** (`lib/db.ts`):
- `query<T>()` - Execute SELECT query
- `queryOne<T>()` - Execute query and return first row
- `insert()` - Execute INSERT and return ID
- `execute()` - Execute UPDATE/DELETE
- `transaction()` - Execute transaction

**Balance Sheet Module** (`lib/balancesheet-db.ts`):
- Similar helpers for `bs_*` tables
- User-scoped operations

### Query Patterns

**User-Scoped Queries**:
All data access follows this pattern:
```sql
SELECT t.* FROM trades t
INNER JOIN accounts a ON t.account_id = a.id
WHERE a.user_id = ?
```

**Transaction Support**:
```typescript
await transaction(async (connection) => {
  // Multiple operations
  await connection.execute('...');
  await connection.execute('...');
});
```

## Service Layer

### Kite Service

**Location**: `equity/lib/kite-service.ts`

**Purpose**: Wrapper around `kiteconnect` SDK

**Key Functions**:
- `executeKiteTool(tool, args)` - Execute any Kite tool
- `getSession(accountId, userId)` - Get authenticated session
- `loadSessionFromDB(accountId, userId)` - Load session from database
- `saveAccessTokenToDB(accountId, userId, accessToken)` - Save token

**Session Management**:
- In-memory cache (Map<accountId, KiteSession>)
- Database persistence (accounts table)
- Lazy loading from database

### Yahoo Finance Service

**Location**: `equity/lib/yahoo-finance.ts`

**Purpose**: Free stock price fetching (no authentication)

**Key Functions**:
- `getCurrentPrices(symbols, exchange)` - Fetch prices for multiple symbols
- `getCurrentPrice(symbol, exchange)` - Fetch single price
- `formatSymbolForYahoo(symbol, exchange)` - Convert to Yahoo format (e.g., RELIANCE.NS)

**Usage**: Used by `/api/stats` for portfolio valuations

### XIRR Calculator

**Location**: `equity/lib/xirr-calculator.ts`

**Purpose**: Calculate Extended Internal Rate of Return

**Key Functions**:
- `calculateXIRR(cashFlows)` - Generic XIRR calculation
- `calculatePortfolioXIRR(ledgerEntries, currentValue)` - Portfolio-level XIRR
- `calculateStockXIRR(trades, currentPrice, currentQuantity)` - Stock-level XIRR

**Library**: Uses `xirr` npm package

## MCP Server Architecture

### Server Structure

**Location**: `src/index.ts`

**Class**: `KiteMCPServer`

**Key Components**:
- `server: Server` - MCP SDK server instance
- `sessions: Map<string, KiteSession>` - Multi-account session storage
- `accountConfigs: KiteAccountConfig[]` - Loaded from environment

### Communication Protocol

**Protocol**: MCP (Model Context Protocol) over stdio

**Format**: JSON-RPC 2.0

**Transport**: StdioServerTransport

### Tool Categories

1. **Authentication**: `list_accounts`, `login`, `generate_session`
2. **Market Data**: `search_instruments`, `get_quotes`, `get_ohlc`, `get_ltp`, `get_historical_data`
3. **Trading**: `place_order`, `modify_order`, `cancel_order`, `get_orders`
4. **Portfolio**: `get_holdings`, `get_positions`, `get_mf_holdings`, `get_trades`, `get_margins`
5. **GTT**: `place_gtt_order`, `modify_gtt_order`, `delete_gtt_order`, `get_gtts`

### Configuration Management

**Location**: `src/config.ts`

**Functions**:
- `loadAccountsConfig()` - Load from environment variables
- `getAccountConfig(accountId)` - Get specific account
- `getAccountsList()` - Get safe list (without secrets)

**Environment Pattern**:
```
KITE_ACC_1_ID=...
KITE_ACC_1_NAME=...
KITE_ACC_1_KEY=...
KITE_ACC_1_SECRET=...
```

### Credential Storage

**Location**: `~/.kite-mcp-credentials.json`

**Format**: JSON object with account IDs as keys

**Content**: API keys, secrets, access tokens

**Security**: File permissions should be 600

## Error Handling

### Standard Error Responses

**Format**:
```json
{
  "success": false,
  "error": "Error message"
}
```

**Status Codes**:
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Authorization failed
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Error Handling Pattern

```typescript
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    // ... route logic
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

## Performance Considerations

### Database

- Connection pooling (10 connections)
- Prepared statements (SQL injection prevention)
- Indexed queries (user_id, account_id, etc.)
- Transaction support for atomic operations

### API

- Async/await for all I/O operations
- Error handling with proper status codes
- User-scoped queries (efficient filtering)

### Caching

- Kite sessions cached in memory
- No response caching currently implemented

