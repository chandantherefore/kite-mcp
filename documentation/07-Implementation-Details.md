# Implementation Details

## Table of Contents

1. [MCP Server Features](#mcp-server-features)
2. [Web Application Features](#web-application-features)
3. [API Endpoints](#api-endpoints)
4. [Database Operations](#database-operations)
5. [Gap Identification](#gap-identification)

## MCP Server Features

### Authentication Flow

**Location**: `src/index.ts`

#### Login Process

1. **Tool**: `login`
2. **Handler**: `executeKiteTool('login', ...)` in `kite-service.ts`
3. **Parameters**:
   - `account_id` (required): Account ID from database
   - `user_id` (required): User ID from session

4. **Process**:
   - Load account from database using `account_id` and `user_id`
   - Verify account has `api_key` and `api_secret`
   - Create KiteConnect instance with API key
   - Generate login URL using `kc.getLoginURL()`
   - Store session in memory (keyed by account_id)
   - Return login URL to user

5. **Response**: Login URL that user must visit to authorize

#### Session Generation

1. **Tool**: `generate_session`
2. **Handler**: `executeKiteTool('generate_session', ...)` in `kite-service.ts`
3. **Parameters**:
   - `account_id` (required): Account ID from database
   - `user_id` (required): User ID from session
   - `request_token` (required): Token from redirect URL

4. **Process**:
   - Retrieve session for account_id (from memory or database)
   - Call `kc.generateSession(request_token, api_secret)`
   - Store access_token in session
   - Set access token on KiteConnect instance
   - Save access token to database using `updateAccountAccessToken()`
   - Update in-memory cache
   - Return session information

5. **Response**: Access token, user ID, and login time

**Note**: All Kite API tools now require `account_id` and `user_id` parameters to ensure user-specific access.

### Market Data Tools

#### Search Instruments

**Tool**: `search_instruments`
**Handler**: `handleSearchInstruments()`

**Parameters**:
- `query` (required): Search query
- `filter_on` (optional): Filter field ('id', 'name', 'isin', 'tradingsymbol', 'underlying')
- `limit` (optional): Maximum results
- `from` (optional): Pagination offset

**Implementation**:
```typescript
const instruments = await session.kc.getInstruments(args.query, args.filter_on);
// Apply pagination if specified
```

#### Get Quotes

**Tool**: `get_quotes`
**Handler**: `handleGetQuotes()`

**Parameters**:
- `instruments` (required): Array of instrument identifiers (e.g., ['NSE:INFY', 'NSE:SBIN'])
- `client_id` (optional): Account identifier

**Returns**: Complete market data snapshot (up to 500 instruments)

#### Get Historical Data

**Tool**: `get_historical_data`
**Handler**: `handleGetHistoricalData()`

**Parameters**:
- `instrument_token` (required): Instrument token
- `from_date` (required): Start date (YYYY-MM-DD HH:MM:SS)
- `to_date` (required): End date (YYYY-MM-DD HH:MM:SS)
- `interval` (required): Candle interval ('minute', 'day', '3minute', '5minute', '10minute', '15minute', '30minute', '60minute')
- `continuous` (optional): For futures/options
- `oi` (optional): Include open interest

### Trading Tools

#### Place Order

**Tool**: `place_order`
**Handler**: `handlePlaceOrder()`

**Required Parameters**:
- `variety`: Order variety ('regular', 'co', 'amo', 'iceberg', 'auction')
- `exchange`: Exchange ('NSE', 'BSE', 'MCX', 'NFO', 'BFO')
- `tradingsymbol`: Trading symbol
- `transaction_type`: 'BUY' or 'SELL'
- `quantity`: Number of shares
- `product`: Product type ('CNC', 'NRML', 'MIS', 'MTF')
- `order_type`: Order type ('MARKET', 'LIMIT', 'SL', 'SL-M')

**Optional Parameters**:
- `price`: Required for LIMIT orders
- `trigger_price`: Required for SL/SL-M orders
- `validity`: Order validity ('DAY', 'IOC', 'TTL')
- `disclosed_quantity`: Quantity to disclose
- `tag`: Order tag (max 20 chars)
- `iceberg_legs`: For iceberg orders
- `iceberg_quantity`: For iceberg orders
- `validity_ttl`: For TTL validity orders

**Implementation**:
```typescript
const response = await session.kc.placeOrder(args.variety, args);
```

### Portfolio Tools

#### Get Holdings

**Tool**: `get_holdings`
**Handler**: `handleGetHoldings()`

**Returns**: Equity holdings with:
- Tradingsymbol
- Quantity
- Average price
- Last price
- P&L information

**Pagination**: Supports `limit` and `from` parameters

#### Get Positions

**Tool**: `get_positions`
**Handler**: `handleGetPositions()`

**Returns**: Current positions with:
- Net positions
- Day positions
- P&L information
- M2M (Mark-to-Market)

### GTT Orders

#### Place GTT Order

**Tool**: `place_gtt_order`
**Handler**: `handlePlaceGTTOrder()`

**Required Parameters**:
- `trigger_type`: 'single' or 'two-leg'
- `exchange`: Exchange
- `tradingsymbol`: Trading symbol
- `last_price`: Last price of instrument
- `transaction_type`: 'BUY' or 'SELL'
- `product`: Product type

**For Single-Leg**:
- `trigger_value`: Price trigger point
- `quantity`: Order quantity
- `limit_price`: Limit price (optional)

**For Two-Leg**:
- `upper_trigger_value`, `upper_quantity`, `upper_limit_price`
- `lower_trigger_value`, `lower_quantity`, `lower_limit_price`

## Web Application Features

### User Authentication

#### Registration

**Page**: `app/register/page.tsx`
**API**: `POST /api/register`

**Features**:
- Username and email validation
- Password strength validation (min 6 characters)
- Profile information collection:
  - First name, last name
  - Date of birth
  - Gender
  - Market expertise level
- Duplicate username/email prevention
- Password hashing with bcrypt
- Email verification token generation
- Verification email sending (via Resend)

**Process**:
1. Validate form data
2. Check for duplicate username/email
3. Hash password with bcrypt
4. Create user in database (is_active=false)
5. Generate verification token
6. Send verification email
7. Return success response

#### Login

**Page**: `app/login/page.tsx`
**API**: `POST /api/auth/[...nextauth]`

**Features**:
- Email/password authentication
- Google OAuth authentication
- Session management with JWT
- Role-based access control
- Email verification check
- Account activation check

**Process**:
1. User submits credentials
2. NextAuth validates credentials
3. Check is_active and email_verified
4. Create JWT session with role and user ID
5. Redirect to dashboard

#### Email Verification

**Page**: `app/verify-email/page.tsx`
**API**: `GET /api/verify-email?token=...`

**Process**:
1. User clicks verification link
2. Server validates token
3. Check token expiration
4. Activate user (is_active=true, email_verified=true)
5. Clear verification token
6. Redirect to login

### Account Management

**Pages**: `app/settings/accounts/page.tsx`
**API**: `/api/accounts`

**Features**:
- Create new accounts (user-specific)
- List all accounts for the current user
- Update account details (only own accounts)
- Delete accounts (only own accounts)
- Link broker IDs
- View sync statistics

**Security**: All account operations are user-scoped. Users can only see and manage accounts they created. The system automatically filters all queries by the authenticated user's ID.

**Operations**:
- `GET /api/accounts`: List all accounts for the current user (requires authentication)
- `POST /api/accounts`: Create account for the current user (requires authentication)
- `GET /api/accounts/[id]`: Get account details (only if owned by current user)
- `PUT /api/accounts/[id]`: Update account (only if owned by current user)
- `DELETE /api/accounts/[id]`: Delete account (only if owned by current user)

**Database Schema**: The `accounts` table includes a `user_id` foreign key that links each account to its owner. All related data (trades, ledger entries, conflicts) is automatically scoped to user accounts through JOIN queries.

### Tradebook Import and Management

#### Import Tradebook

**Page**: `app/import/page.tsx`
**API**: `POST /api/import/tradebook`

**Features**:
- CSV file upload
- Account selection
- CSV parsing and validation
- Duplicate detection
- Conflict creation for mismatches
- Batch tracking with UUID
- Progress reporting

**CSV Format Expected**:
- Columns: symbol, isin, trade_date, exchange, segment, series, trade_type, auction, quantity, price, trade_id, order_id, order_execution_time

**Process**:
1. Parse CSV file
2. Validate each record
3. Check for existing trade (by trade_id)
4. If duplicate:
   - Compare data
   - If different, create conflict
   - If same, skip
5. If new, insert trade
6. Update account sync timestamp
7. Return import results

#### Tradebook Management

**Page**: `app/tradebook/page.tsx`
**API**: `/api/tradebook`, `/api/trades`

**Features**:
- View all trades
- Filter by account
- Filter by symbol
- Edit trade details
- Delete trades
- Bulk operations

**Operations** (all user-scoped):
- `GET /api/tradebook`: Get tradebook with grouping (only trades from user's accounts)
- `GET /api/trades`: List trades (only from user's accounts)
- `POST /api/trades`: Create trade (only in user's accounts)
- `PUT /api/trades/[id]`: Update trade (only if owned by user)
- `DELETE /api/trades/[id]`: Delete trade (only if owned by user)
- `POST /api/trades/bulk-update`: Bulk update trades (only in user's accounts)

### Ledger Import and Management

#### Import Ledger

**Page**: `app/import/page.tsx`
**API**: `POST /api/import/ledger`

**Features**:
- CSV file upload
- Account selection
- CSV parsing and validation
- Duplicate detection
- Conflict creation
- Batch tracking

**CSV Format Expected**:
- Columns: particular, posting_date, cost_center, voucher_type, debit, credit, net_balance

**Process**: Similar to tradebook import

#### Ledger Management

**Page**: `app/ledger/page.tsx`
**API**: `GET /api/ledger`

**Features** (all user-scoped):
- View ledger entries (only from user's accounts)
- Filter by account (only user's accounts)
- Filter by date range
- Cash flow tracking

**Security**: All ledger queries are filtered by user_id through account ownership. Users can only see ledger entries from their own accounts.

### Portfolio Views

#### Dashboard

**Page**: `app/dashboard/page.tsx`
**API**: `GET /api/stats`

**Features**:
- Portfolio statistics
- Account selection (consolidated or individual)
- Total investment
- Current value
- Total P&L
- XIRR calculation
- Holdings count
- Active vs sold holdings

**Data Sources** (all user-scoped):
- Manual CSV data (from database, only user's accounts)
- Live Kite data (via MCP server, only authenticated accounts)

**Security**: All portfolio statistics are calculated only from the authenticated user's accounts. Users cannot see data from other users' accounts.

#### Holdings

**Page**: `app/holdings/page.tsx`
**API**: `GET /api/stats`

**Features**:
- Holdings list with P&L
- Account filtering
- Stock-level XIRR
- Current price display
- Investment vs current value
- P&L percentage

#### Positions

**Page**: `app/positions/page.tsx`

**Features**:
- Open positions view
- Net positions
- Day positions
- P&L information
- Live data from Kite

### XIRR Calculations

**Location**: `lib/xirr-calculator.ts`

#### Portfolio XIRR

**Function**: `calculatePortfolioXIRR()`

**Process**:
1. Get ledger entries for account
2. Calculate cash flows: credit - debit
3. Add current portfolio value as final cash flow
4. Call xirr library
5. Return as percentage

#### Stock XIRR

**Function**: `calculateStockXIRR()`

**Process**:
1. Get all trades for symbol
2. Calculate cash flows:
   - Buy trades: negative (outflow)
   - Sell trades: positive (inflow)
3. Add current holdings value as final cash flow
4. Call xirr library
5. Return as percentage

### Conflict Resolution

**Page**: `app/conflicts/page.tsx`
**API**: `/api/conflicts`

**Features**:
- View all conflicts
- Filter by account
- Filter by status
- Resolution options:
  - Keep existing
  - Use new
  - Manual resolution
  - Ignore

**Operations**:
- `GET /api/conflicts`: List conflicts
- `GET /api/conflicts/[id]`: Get conflict details
- `PUT /api/conflicts/[id]`: Resolve conflict

### Admin Panel

**Pages**: `app/admin/page.tsx`, `app/admin/users/page.tsx`
**API**: `/api/admin/users`

**Features**:
- User list
- User activation/deactivation
- Role management (user/admin)
- User deletion
- User statistics

**Operations**:
- `GET /api/admin/users`: List all users
- `PATCH /api/admin/users`: Update user (role, active status)

### Live Kite Integration

**Store**: `store/useKiteStore.ts`
**API**: `/api/kite/execute`

**Features**:
- Fetch live holdings
- Fetch live positions
- Fetch live margins
- Multi-account support
- Consolidated view
- Data privacy toggle

**Process**:
1. Fetch account list
2. For each account:
   - Get profile
   - Get holdings
   - Get positions
   - Get margins
3. Calculate consolidated view
4. Update store

## API Endpoints

### Authentication

- `POST /api/register` - User registration
- `GET /api/verify-email?token=...` - Email verification
- `POST /api/auth/[...nextauth]` - NextAuth endpoints (login, logout, callback)

### Accounts

- `GET /api/accounts` - List accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts/[id]` - Get account
- `PUT /api/accounts/[id]` - Update account
- `DELETE /api/accounts/[id]` - Delete account

### Trades

- `GET /api/trades?accountId=...&symbol=...` - List trades
- `POST /api/trades` - Create trade
- `GET /api/trades/[id]` - Get trade
- `PUT /api/trades/[id]` - Update trade
- `DELETE /api/trades/[id]` - Delete trade
- `POST /api/trades/bulk-update` - Bulk update

### Tradebook

- `GET /api/tradebook?accountId=...` - Get tradebook data

### Ledger

- `GET /api/ledger?accountId=...` - Get ledger entries
- `POST /api/import/ledger` - Import ledger CSV

### Import

- `POST /api/import/tradebook` - Import tradebook CSV
- `POST /api/import/ledger` - Import ledger CSV

### Conflicts

- `GET /api/conflicts?accountId=...&status=...` - List conflicts
- `GET /api/conflicts/[id]` - Get conflict
- `PUT /api/conflicts/[id]` - Resolve conflict

### Kite Integration

- `GET /api/kite/accounts` - List Kite accounts
- `POST /api/kite/auth` - Kite authentication
- `POST /api/kite/execute` - Execute Kite tool

### Statistics

- `GET /api/stats?accountId=...` - Portfolio statistics

### Tools

- `POST /api/tools/split` - Apply stock split
- `GET /api/tools/split/symbols?accountId=...` - Get symbols for account

### Admin

- `GET /api/admin/users` - List users
- `PATCH /api/admin/users` - Update user

## Database Operations

### User Operations

**Location**: `lib/db.ts`

- `db.createUser()` - Create new user
- `db.findUserByEmail()` - Find user by email
- `db.findUserByUsername()` - Find user by username
- `db.findUserById()` - Find user by ID
- `db.findUserByGoogleId()` - Find user by Google ID
- `db.setVerificationToken()` - Set verification token
- `db.verifyUserByToken()` - Verify user by token
- `db.getAllUsers()` - Get all users
- `db.toggleUserActive()` - Toggle user active status
- `db.updateUserRole()` - Update user role
- `db.deleteUser()` - Delete user

### Account Operations

- `db.getAccounts()` - Get all accounts
- `db.getAccountById()` - Get account by ID
- `db.createAccount()` - Create account
- `db.updateAccount()` - Update account
- `db.deleteAccount()` - Delete account

### Trade Operations

- `db.getTrades()` - Get trades (with filters)
- `db.insertTrade()` - Insert trade (with duplicate handling)
- `db.getTradeById()` - Get trade by ID
- `db.updateTrade()` - Update trade
- `db.deleteTrade()` - Delete trade
- `db.getTradesForSymbol()` - Get trades for symbol
- `db.applyStockSplit()` - Apply stock split to trades

### Ledger Operations

- `db.getLedger()` - Get ledger entries (with filters)
- `db.insertLedger()` - Insert ledger entry

### Holdings Operations

- `db.getHoldings()` - Calculate holdings from trades
- `db.getCashFlows()` - Get cash flows for XIRR

### Conflict Operations

- `db.getConflicts()` - Get conflicts (with filters)
- `db.createConflict()` - Create conflict record
- `db.resolveConflict()` - Resolve conflict
- `db.deleteConflict()` - Delete conflict

### Account Sync Operations

- `db.updateAccountSync()` - Update sync timestamps and record counts

## Gap Identification

The following areas require additional implementation documentation:

1. **Error Handling Details**: Comprehensive error handling strategies and error codes
2. **Edge Cases**: Handling of edge cases and boundary conditions
3. **Performance Optimizations**: Specific performance optimizations implemented
4. **Caching Strategies**: Caching implementation and cache invalidation
5. **Rate Limiting**: Rate limiting implementation for APIs
6. **Validation Rules**: Detailed validation rules for all inputs
7. **Transaction Management**: Database transaction usage and rollback strategies
8. **Logging**: Logging implementation and log levels
9. **Testing**: Unit tests, integration tests, and E2E tests
10. **Monitoring**: Application monitoring and alerting implementation

See also: [08-Special-Considerations.md](08-Special-Considerations.md) for additional considerations.

