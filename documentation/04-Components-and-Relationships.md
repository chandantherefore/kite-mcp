# Components and Relationships

## Table of Contents

1. [Component Overview](#component-overview)
2. [MCP Server Components](#mcp-server-components)
3. [Next.js Application Components](#nextjs-application-components)
4. [Component Interactions](#component-interactions)
5. [Data Flow](#data-flow)
6. [Gap Identification](#gap-identification)

## Component Overview

The system is composed of two main subsystems:

1. **Kite MCP Server**: Standalone Node.js application providing MCP protocol interface
2. **OneApp Portfolio Manager**: Next.js web application with client and server components

## MCP Server Components

### Core Components

#### 1. KiteMCPServer Class

**Location**: `src/index.ts`

**Purpose**: Main server class that implements the MCP protocol and manages all tool handlers.

**Key Properties**:
- `server: Server` - MCP SDK server instance
- `sessions: Map<string, KiteSession>` - Multi-account session storage
- `accountConfigs: KiteAccountConfig[]` - Loaded account configurations

**Key Methods**:
- `constructor()` - Initializes server and loads configurations
- `setupHandlers()` - Registers MCP request handlers
- `loadCredentials()` - Loads saved credentials from disk
- `saveCredentials()` - Persists credentials to disk
- `getSession(clientId?)` - Retrieves authenticated session
- `handleLogin()` - Handles login tool
- `handleGenerateSession()` - Handles session generation
- Tool handlers: `handleGetProfile()`, `handlePlaceOrder()`, etc.

**Dependencies**:
- `@modelcontextprotocol/sdk` - MCP SDK
- `kiteconnect` - Kite Connect SDK
- `src/config.ts` - Configuration loader

#### 2. Configuration Module

**Location**: `src/config.ts`

**Purpose**: Manages multi-account configuration from environment variables.

**Key Functions**:
- `loadAccountsConfig()`: Loads all accounts from environment
- `getAccountConfig(accountId)`: Gets config for specific account
- `getAccountsList()`: Returns safe account list (without secrets)

**Interface**:
```typescript
interface KiteAccountConfig {
  id: string;       // Unique identifier (e.g., "father")
  name: string;     // Display name
  apiKey: string;
  apiSecret: string;
}
```

**Dependencies**: None (pure functions)

### Tool Handlers

#### Authentication Tools

1. **list_accounts**
   - Handler: `handleListAccounts()`
   - Returns: List of configured accounts

2. **login**
   - Handler: `handleLogin()`
   - Parameters: `client_id`, `api_key?`, `api_secret?`
   - Returns: Login URL for authorization

3. **generate_session**
   - Handler: `handleGenerateSession()`
   - Parameters: `client_id`, `request_token`
   - Returns: Access token and user info

#### Market Data Tools

1. **search_instruments**
   - Handler: `handleSearchInstruments()`
   - Parameters: `query`, `filter_on?`, `limit?`, `from?`
   - Returns: Matching instruments

2. **get_quotes**
   - Handler: `handleGetQuotes()`
   - Parameters: `instruments[]`, `client_id?`
   - Returns: Market quotes

3. **get_ohlc**
   - Handler: `handleGetOHLC()`
   - Parameters: `instruments[]`, `client_id?`
   - Returns: OHLC data

4. **get_ltp**
   - Handler: `handleGetLTP()`
   - Parameters: `instruments[]`, `client_id?`
   - Returns: Last traded prices

5. **get_historical_data**
   - Handler: `handleGetHistoricalData()`
   - Parameters: `instrument_token`, `from_date`, `to_date`, `interval`, `continuous?`, `oi?`
   - Returns: Historical candle data

#### Trading Tools

1. **place_order**
   - Handler: `handlePlaceOrder()`
   - Parameters: Order parameters (variety, exchange, tradingsymbol, etc.)
   - Returns: Order ID

2. **modify_order**
   - Handler: `handleModifyOrder()`
   - Parameters: `variety`, `order_id`, order parameters
   - Returns: Modified order details

3. **cancel_order**
   - Handler: `handleCancelOrder()`
   - Parameters: `variety`, `order_id`
   - Returns: Cancellation confirmation

4. **get_orders**
   - Handler: `handleGetOrders()`
   - Parameters: `limit?`, `from?`, `client_id?`
   - Returns: List of orders with pagination

5. **get_order_history**
   - Handler: `handleGetOrderHistory()`
   - Parameters: `order_id`, `client_id?`
   - Returns: Order history

6. **get_order_trades**
   - Handler: `handleGetOrderTrades()`
   - Parameters: `order_id`, `client_id?`
   - Returns: Trades for order

#### Portfolio Tools

1. **get_holdings**
   - Handler: `handleGetHoldings()`
   - Parameters: `client_id?`, `limit?`, `from?`
   - Returns: Equity holdings

2. **get_positions**
   - Handler: `handleGetPositions()`
   - Parameters: `client_id?`, `limit?`, `from?`
   - Returns: Current positions (net and day)

3. **get_mf_holdings**
   - Handler: `handleGetMFHoldings()`
   - Parameters: `client_id?`, `limit?`, `from?`
   - Returns: Mutual fund holdings

4. **get_trades**
   - Handler: `handleGetTrades()`
   - Parameters: `client_id?`, `limit?`, `from?`
   - Returns: Trading history

5. **get_margins**
   - Handler: `handleGetMargins()`
   - Parameters: `client_id?`
   - Returns: Margin details

#### GTT Tools

1. **place_gtt_order**
   - Handler: `handlePlaceGTTOrder()`
   - Parameters: GTT order parameters
   - Returns: GTT trigger ID

2. **modify_gtt_order**
   - Handler: `handleModifyGTTOrder()`
   - Parameters: `trigger_id`, GTT order parameters
   - Returns: Modified GTT details

3. **delete_gtt_order**
   - Handler: `handleDeleteGTTOrder()`
   - Parameters: `trigger_id`, `client_id?`
   - Returns: Deletion confirmation

4. **get_gtts**
   - Handler: `handleGetGTTs()`
   - Parameters: `limit?`, `from?`, `client_id?`
   - Returns: List of active GTT orders

## Next.js Application Components

### Page Components

#### 1. Dashboard

**Location**: `equity/app/dashboard/page.tsx`

**Purpose**: Main dashboard showing portfolio statistics and overview.

**Features**:
- Manual CSV data statistics
- Live Kite data integration
- Account selection (consolidated or individual)
- XIRR calculations
- Holdings summary

**Dependencies**:
- `useKiteStore` - Live Kite data
- `/api/stats` - Portfolio statistics API
- `/api/accounts` - Accounts list

#### 2. Holdings

**Location**: `equity/app/holdings/page.tsx`

**Purpose**: Display current holdings with P&L information.

**Features**:
- Holdings list with P&L
- Account filtering
- Stock-level XIRR
- Current price display

**Dependencies**:
- `/api/stats` - Holdings data
- `/api/kite/execute` - Live price data

#### 3. Tradebook

**Location**: `equity/app/tradebook/page.tsx`

**Purpose**: Manage trade records.

**Features**:
- Trade list with filtering
- Trade editing
- Bulk operations
- Account filtering

**Dependencies**:
- `/api/tradebook` - Tradebook data
- `/api/trades` - Trade CRUD operations

#### 4. Import

**Location**: `equity/app/import/page.tsx`

**Purpose**: Import CSV files (tradebook and ledger).

**Features**:
- File upload interface
- Account selection
- Import progress
- Conflict detection

**Dependencies**:
- `/api/import/tradebook` - Tradebook import
- `/api/import/ledger` - Ledger import

#### 5. Conflicts

**Location**: `equity/app/conflicts/page.tsx`

**Purpose**: Resolve import conflicts.

**Features**:
- Conflict list
- Resolution options
- Account filtering
- Status filtering

**Dependencies**:
- `/api/conflicts` - Conflict management

#### 6. Admin Panel

**Location**: `equity/app/admin/`

**Purpose**: User management for administrators.

**Features**:
- User list
- User activation/deactivation
- Role management
- User deletion

**Dependencies**:
- `/api/admin/users` - User management API

### API Route Components

#### Authentication Routes

**Location**: `equity/app/api/auth/[...nextauth]/route.ts`

**Purpose**: NextAuth.js authentication endpoints.

**Providers**:
- Credentials (email/password)
- Google OAuth

**Callbacks**:
- `signIn`: Handle OAuth user creation
- `jwt`: Add role and ID to token
- `session`: Add role and ID to session

#### Account Routes

**Location**: `equity/app/api/accounts/`

**Endpoints**:
- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts/[id]` - Get account
- `PUT /api/accounts/[id]` - Update account
- `DELETE /api/accounts/[id]` - Delete account

**Dependencies**:
- `lib/db.ts` - Database operations

#### Trade Routes

**Location**: `equity/app/api/trades/`

**Endpoints**:
- `GET /api/trades` - List trades
- `POST /api/trades` - Create trade
- `GET /api/trades/[id]` - Get trade
- `PUT /api/trades/[id]` - Update trade
- `DELETE /api/trades/[id]` - Delete trade
- `POST /api/trades/bulk-update` - Bulk update

**Dependencies**:
- `lib/db.ts` - Database operations

#### Import Routes

**Location**: `equity/app/api/import/`

**Endpoints**:
- `POST /api/import/tradebook` - Import tradebook CSV
- `POST /api/import/ledger` - Import ledger CSV

**Features**:
- CSV parsing
- Data validation
- Conflict detection
- Batch tracking

**Dependencies**:
- `csv-parse` - CSV parsing
- `lib/db.ts` - Database operations

#### Kite Integration Routes

**Location**: `equity/app/api/kite/`

**Endpoints**:
- `GET /api/kite/accounts` - List Kite accounts
- `POST /api/kite/auth` - Kite authentication
- `POST /api/kite/execute` - Execute Kite tool

**Dependencies**:
- `lib/kite-service.ts` - Kite API service

### Library Components

#### 1. Database Module

**Location**: `equity/lib/db.ts`

**Purpose**: Database operations and models.

**Key Functions**:
- `query<T>()` - Execute SELECT query
- `queryOne<T>()` - Execute query and return first row
- `insert()` - Execute INSERT and return ID
- `execute()` - Execute UPDATE/DELETE
- `transaction()` - Execute transaction

**Helper Functions**:
- `db.createUser()` - Create user
- `db.findUserByEmail()` - Find user by email
- `db.getAccounts()` - Get all accounts
- `db.getTrades()` - Get trades
- `db.getHoldings()` - Calculate holdings
- `db.getConflicts()` - Get conflicts
- `db.applyStockSplit()` - Apply stock split

**Dependencies**:
- `mysql2/promise` - MySQL client

#### 2. Kite Service

**Location**: `equity/lib/kite-service.ts`

**Purpose**: Wrapper for Kite API operations.

**Key Functions**:
- `executeKiteTool(tool, args)` - Execute any Kite tool
- `getSession(clientId)` - Get authenticated session
- `loadCredentials()` - Load saved credentials
- `saveCredentials()` - Save credentials

**Supported Tools**:
- Authentication: `list_accounts`, `login`, `generate_session`
- Market Data: `get_quotes`, `get_ltp`
- Portfolio: `get_profile`, `get_margins`, `get_holdings`, `get_positions`, `get_mf_holdings`, `get_orders`
- Trading: `place_order`, `modify_order`, `cancel_order`

**Dependencies**:
- `kiteconnect` - Kite Connect SDK
- `fs` - File system operations

#### 3. XIRR Calculator

**Location**: `equity/lib/xirr-calculator.ts`

**Purpose**: Calculate XIRR (Extended Internal Rate of Return).

**Key Functions**:
- `calculateXIRR(cashFlows)` - Calculate XIRR from cash flows
- `calculatePortfolioXIRR(ledgerEntries, currentValue)` - Calculate portfolio XIRR
- `calculateStockXIRR(trades, currentPrice, currentQuantity)` - Calculate stock-level XIRR

**Dependencies**:
- `xirr` - XIRR calculation library

### State Management Components

#### Kite Store

**Location**: `equity/store/useKiteStore.ts`

**Purpose**: Client-side state management for live Kite data.

**State Structure**:
- `availableAccounts`: List of configured accounts
- `accounts`: Per-account data (profile, holdings, positions, margins)
- `consolidated`: Aggregated view across all accounts
- `isLoading`: Loading state
- `error`: Error state
- `isDataHidden`: Privacy toggle

**Key Actions**:
- `fetchAccounts()` - Fetch account list
- `fetchAccountData(accountId)` - Fetch data for account
- `fetchAllAccountsData()` - Fetch all accounts
- `calculateConsolidated()` - Calculate consolidated view
- `toggleDataVisibility()` - Toggle privacy mode

**Dependencies**:
- `zustand` - State management library
- `/api/kite/execute` - Kite API

### UI Components

#### Navigation

**Location**: `equity/components/Navigation.tsx`

**Purpose**: Main navigation component.

**Features**:
- Navigation links
- User authentication state
- Admin link (for admins)
- Logout functionality

**Dependencies**:
- `next-auth/react` - Session management
- `lucide-react` - Icons

## Component Interactions

### MCP Server Interaction Flow

```
MCP Client
    │
    │ stdio (JSON-RPC)
    │
    ▼
KiteMCPServer
    │
    │ getSession()
    │
    ▼
KiteSession (from Map)
    │
    │ KiteConnect SDK
    │
    ▼
Zerodha Kite API
```

### Web Application Interaction Flow

```
Browser
    │
    │ HTTP Request
    │
    ▼
Next.js API Route
    │
    │ Business Logic
    │
    ├─► lib/db.ts ──► MySQL Database
    │
    └─► lib/kite-service.ts ──► Kite MCP Server ──► Kite API
```

### Authentication Flow

```
User
    │
    │ Login Form
    │
    ▼
NextAuth Credentials Provider
    │
    │ Validate Credentials
    │
    ▼
lib/db.ts
    │
    │ Check User
    │
    ▼
Create JWT Session
    │
    │
    ▼
Redirect to Dashboard
```

### Import Flow

```
User Uploads CSV
    │
    ▼
/api/import/tradebook
    │
    │ Parse CSV
    │
    ▼
Validate Data
    │
    ├─► Check for Duplicates
    │   │
    │   ├─► No Duplicate ──► Insert Trade
    │   │
    │   └─► Duplicate ──► Check Differences
    │       │
    │       ├─► Same Data ──► Skip
    │       │
    │       └─► Different Data ──► Create Conflict
    │
    ▼
Update Account Sync Timestamp
    │
    ▼
Return Import Results
```

## Data Flow

### Tradebook Import Data Flow

```
CSV File
    │
    ▼
Parse CSV (csv-parse)
    │
    ▼
Validate Each Record
    │
    ├─► Invalid ──► Add to Errors
    │
    └─► Valid ──► Check Database
        │
        ├─► Exists ──► Compare Data
        │   │
        │   ├─► Same ──► Skip
        │   │
        │   └─► Different ──► Create Conflict
        │
        └─► New ──► Insert Trade
            │
            ▼
        Update Account Stats
```

### Live Kite Data Flow

```
User Requests Live Data
    │
    ▼
useKiteStore.fetchAllAccountsData()
    │
    ▼
For Each Account:
    │
    ├─► /api/kite/execute (get_profile)
    ├─► /api/kite/execute (get_holdings)
    ├─► /api/kite/execute (get_positions)
    ├─► /api/kite/execute (get_mf_holdings)
    └─► /api/kite/execute (get_margins)
    │
    ▼
lib/kite-service.ts
    │
    ▼
Kite MCP Server (via stdio)
    │
    ▼
Zerodha Kite API
    │
    ▼
Response Flows Back
    │
    ▼
Store in useKiteStore
    │
    ▼
Calculate Consolidated View
    │
    ▼
Update UI
```

### XIRR Calculation Data Flow

```
User Views Holdings
    │
    ▼
/api/stats
    │
    ├─► Get Trades for Symbol
    ├─► Get Ledger Entries
    └─► Get Current Price
    │
    ▼
lib/xirr-calculator.ts
    │
    ├─► calculateStockXIRR()
    │   │
    │   ├─► Process Trades (buy = negative, sell = positive)
    │   └─► Add Current Value
    │
    └─► calculatePortfolioXIRR()
        │
        ├─► Process Ledger (credit - debit)
        └─► Add Current Portfolio Value
    │
    ▼
xirr Library
    │
    ▼
Return XIRR Percentage
```

## Gap Identification

The following areas require additional component documentation:

1. **Component Dependency Graphs**: Visual dependency graphs for all components
2. **API Contracts**: Detailed API contracts with request/response schemas
3. **Error Handling Flow**: Comprehensive error handling and propagation flow
4. **State Management Flow**: Detailed state management flow diagrams
5. **Component Lifecycle**: Component lifecycle documentation
6. **Testing Strategy**: Component testing strategy and test coverage
7. **Performance Optimization**: Component-level performance optimizations
8. **Security Components**: Security-related components and their interactions

See also: [07-Implementation-Details.md](07-Implementation-Details.md) for feature-specific details.

