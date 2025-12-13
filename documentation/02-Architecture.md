# Architecture

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [MCP Server Architecture](#mcp-server-architecture)
3. [Next.js Application Architecture](#nextjs-application-architecture)
4. [Database Architecture](#database-architecture)
5. [Authentication Flow](#authentication-flow)
6. [API Architecture](#api-architecture)
7. [Communication Patterns](#communication-patterns)
8. [Gap Identification](#gap-identification)

## System Architecture Overview

The system consists of two main components that work together:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                      │
│  (Claude Desktop, AI Assistants, Web Browsers)             │
└──────────────┬──────────────────────────┬──────────────────┘
               │                          │
               │ MCP Protocol             │ HTTP/REST
               │                          │
    ┌──────────▼──────────┐   ┌──────────▼──────────────┐
    │   Kite MCP Server   │   │  OneApp Portfolio        │
    │   (Node.js/TypeScript)│   │  Manager (Next.js)      │
    └──────────┬──────────┘   └──────────┬──────────────┘
               │                          │
               │                          │
               └──────────┬────────────────┘
                         │
                         │ Kite Connect API
                         │
              ┌──────────▼──────────┐
              │  Zerodha Kite      │
              │  Connect API       │
              └────────────────────┘
```

### Component Interaction

1. **MCP Server**: Standalone Node.js process that communicates via stdio with MCP clients
2. **Portfolio Manager**: Next.js web application with server-side and client-side components
3. **Database**: MySQL database for storing portfolio data
4. **Kite Connect API**: External API for trading operations and market data

## MCP Server Architecture

### Architecture Pattern

The MCP Server follows a **Tool-Based Architecture** where each trading operation is exposed as a tool that can be called by MCP clients.

```
┌─────────────────────────────────────────────────┐
│            MCP Client (Claude Desktop)          │
└────────────────────┬────────────────────────────┘
                     │ stdio (JSON-RPC)
                     │
┌────────────────────▼────────────────────────────┐
│         KiteMCPServer Class                      │
│  ┌──────────────────────────────────────────┐   │
│  │  Server (MCP SDK)                        │   │
│  │  - ListToolsRequestHandler                │   │
│  │  - CallToolRequestHandler                 │   │
│  └──────────────────────────────────────────┘   │
│                                                   │
│  ┌──────────────────────────────────────────┐   │
│  │  Session Management                      │   │
│  │  - Multi-account sessions                │   │
│  │  - Credential storage                    │   │
│  │  - Token management                      │   │
│  └──────────────────────────────────────────┘   │
│                                                   │
│  ┌──────────────────────────────────────────┐   │
│  │  Tool Handlers                           │   │
│  │  - Authentication tools                  │   │
│  │  - Market data tools                     │   │
│  │  - Trading tools                        │   │
│  │  - Portfolio tools                      │   │
│  │  - GTT tools                            │   │
│  └──────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────┘
                      │
                      │ KiteConnect SDK
                      │
          ┌───────────▼───────────┐
          │  Zerodha Kite Connect │
          │  API                  │
          └───────────────────────┘
```

### Key Components

#### 1. KiteMCPServer Class
**Location**: `src/index.ts`

- **Responsibility**: Main server class that manages MCP protocol communication
- **Key Methods**:
  - `setupHandlers()`: Registers MCP request handlers
  - `getSession()`: Retrieves authenticated session for an account
  - Tool handler methods: Individual handlers for each tool

#### 2. Session Management

**Web Application**:
- **Location**: `equity/lib/kite-service.ts`
- **Storage**: Database (`accounts` table) for credentials, in-memory cache for active sessions
- **Multi-Account Support**: Map-based session storage with account IDs as keys
- **User-Specific**: Each user can only access their own accounts
- **Session Lifecycle**:
  1. Load credentials from database on demand
  2. Create session on login
  3. Generate access token on authorization
  4. Save access token to database
  5. Cache session in memory for performance

**MCP Server** (if running separately):
- **Location**: `src/index.ts` (KiteMCPServer class)
- **Storage**: `~/.kite-mcp-credentials.json`
- **Multi-Account Support**: Map-based session storage with account IDs as keys
- **Session Lifecycle**:
  1. Load saved credentials on startup
  2. Create session on login
  3. Generate access token on authorization
  4. Persist credentials after authentication

#### 3. Configuration Management

**Web Application**:
- **Location**: Database (`accounts` table)
- **Function**: Kite API credentials are stored in the database and managed through the Accounts page
- **Fields**: `api_key`, `api_secret`, `access_token`, `access_token_expires_at`
- **User Interface**: Settings > Accounts page allows users to add/edit credentials

**MCP Server** (if running separately):
- **Location**: `src/config.ts`
- **Function**: Loads multi-account configuration from environment variables
- **Format**: `KITE_ACC_{N}_ID`, `KITE_ACC_{N}_NAME`, `KITE_ACC_{N}_KEY`, `KITE_ACC_{N}_SECRET`
- **Functions**:
  - `loadAccountsConfig()`: Loads all configured accounts
  - `getAccountConfig()`: Gets config for specific account
  - `getAccountsList()`: Returns safe list (without secrets)

### Communication Flow

```
MCP Client → stdio → MCP Server → KiteConnect SDK → Kite API
                ↓
         Response via stdio
```

## Next.js Application Architecture

### Architecture Pattern

The Portfolio Manager uses **Next.js App Router** with the following architecture:

```
┌──────────────────────────────────────────────────────┐
│              Client (Browser)                        │
│  ┌──────────────────────────────────────────────┐   │
│  │  React Components (Pages)                    │   │
│  │  - Dashboard, Holdings, Tradebook, etc.     │   │
│  └──────────────┬───────────────────────────────┘   │
│                 │                                    │
│  ┌──────────────▼───────────────────────────────┐   │
│  │  Client State (Zustand)                       │   │
│  │  - useKiteStore                              │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────┬───────────────────────────────────┘
                   │ HTTP/REST
┌──────────────────▼───────────────────────────────────┐
│         Next.js Server                               │
│  ┌──────────────────────────────────────────────┐   │
│  │  API Routes (App Router)                      │   │
│  │  - /api/accounts                              │   │
│  │  - /api/trades                                │   │
│  │  - /api/kite/execute                          │   │
│  │  - /api/auth/[...nextauth]                    │   │
│  └──────────────┬───────────────────────────────┘   │
│                 │                                    │
│  ┌──────────────▼───────────────────────────────┐   │
│  │  Business Logic Layer                         │   │
│  │  - lib/db.ts (Database operations)           │   │
│  │  - lib/kite-service.ts (Kite API)            │   │
│  │  - lib/xirr-calculator.ts (XIRR)              │   │
│  └──────────────┬───────────────────────────────┘   │
└──────────────────┬───────────────────────────────────┘
                   │
    ┌──────────────┴──────────────┐
    │                             │
┌───▼────┐              ┌─────────▼─────────┐
│ MySQL  │              │  Kite Connect API  │
│Database│              │  (via MCP Server) │
└────────┘              └───────────────────┘
```

### Key Components

#### 1. Pages (App Router)
**Location**: `equity/app/`

- **Server Components**: Default Next.js components (can be async)
- **Client Components**: Marked with `'use client'` directive
- **Key Pages**:
  - `dashboard/page.tsx`: Main dashboard
  - `holdings/page.tsx`: Holdings view
  - `tradebook/page.tsx`: Tradebook management
  - `import/page.tsx`: CSV import interface
  - `admin/page.tsx`: Admin panel

#### 2. API Routes
**Location**: `equity/app/api/`

- **RESTful Design**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **Route Structure**: Organized by resource (accounts, trades, ledger, etc.)
- **Authentication**: Protected by NextAuth middleware

#### 3. Business Logic Layer
**Location**: `equity/lib/`

- **db.ts**: Database operations and models
- **kite-service.ts**: Kite API integration (uses MCP server internally)
- **xirr-calculator.ts**: XIRR calculation functions

#### 4. State Management
**Location**: `equity/store/useKiteStore.ts`

- **Library**: Zustand
- **Purpose**: Client-side state for live Kite data
- **Features**:
  - Multi-account data management (user-specific)
  - Consolidated view calculations (only user's accounts)
  - Data visibility toggle

#### 5. Authentication
**Location**: `equity/app/api/auth/[...nextauth]/route.ts`

- **Provider**: NextAuth.js
- **Strategies**:
  - Credentials (email/password)
  - Google OAuth
- **Session**: JWT-based sessions

## Database Architecture

### Database System

- **Type**: MySQL 8.0+
- **Engine**: InnoDB
- **Character Set**: utf8mb4
- **Collation**: utf8mb4_unicode_ci

### Connection Management

**Location**: `equity/lib/db.ts`

- **Connection Pool**: mysql2 connection pool
- **Configuration**: Environment variables
- **Pool Settings**:
  - `connectionLimit`: 10
  - `waitForConnections`: true
  - `queueLimit`: 0

### Database Schema

See [03-Data-Modeling.md](03-Data-Modeling.md) for detailed schema documentation.

### Key Tables

1. **users**: User accounts and authentication
2. **accounts**: Trading accounts
3. **trades**: Trade records
4. **ledger**: Ledger/transaction records
5. **import_conflicts**: Import conflict tracking

## Authentication Flow

### MCP Server Authentication

```
1. Client calls login tool with client_id
   ↓
2. Server generates login URL
   ↓
3. User authorizes in browser
   ↓
4. User receives request_token
   ↓
5. Client calls generate_session with request_token
   ↓
6. Server exchanges token for access_token
   ↓
7. Server stores credentials in ~/.kite-mcp-credentials.json
   ↓
8. Session ready for API calls
```

### Web Application Authentication

#### Registration Flow

```
1. User fills registration form
   ↓
2. POST /api/register
   ↓
3. Server validates data
   ↓
4. Password hashed with bcrypt
   ↓
5. User created in database (is_active=false)
   ↓
6. Verification email sent
   ↓
7. User clicks verification link
   ↓
8. GET /verify-email?token=...
   ↓
9. User activated (is_active=true)
```

#### Login Flow

```
1. User submits credentials
   ↓
2. NextAuth credentials provider
   ↓
3. Server validates password
   ↓
4. Check is_active and email_verified
   ↓
5. Create JWT session
   ↓
6. Redirect to dashboard
```

#### Google OAuth Flow

```
1. User clicks "Sign in with Google"
   ↓
2. Redirect to Google OAuth
   ↓
3. User authorizes
   ↓
4. Google redirects with code
   ↓
5. NextAuth exchanges code for profile
   ↓
6. Check if user exists by email
   ↓
7. If not exists, create new user
   ↓
8. Link Google ID to user
   ↓
9. Create JWT session
```

## API Architecture

### MCP Server API

**Protocol**: MCP (Model Context Protocol) over stdio
**Format**: JSON-RPC 2.0

**Tool Categories**:
1. Authentication: `login`, `generate_session`, `list_accounts`
2. Market Data: `search_instruments`, `get_quotes`, `get_ohlc`, `get_ltp`, `get_historical_data`
3. Trading: `place_order`, `modify_order`, `cancel_order`, `get_orders`
4. Portfolio: `get_holdings`, `get_positions`, `get_mf_holdings`, `get_trades`, `get_margins`
5. GTT: `place_gtt_order`, `modify_gtt_order`, `delete_gtt_order`, `get_gtts`

### Web Application API

**Protocol**: HTTP/REST
**Base URL**: `/api`

**API Endpoints**:

#### Authentication
- `POST /api/register` - User registration
- `POST /api/verify-email` - Email verification
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

#### Accounts
- `GET /api/accounts` - List accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts/[id]` - Get account
- `PUT /api/accounts/[id]` - Update account
- `DELETE /api/accounts/[id]` - Delete account

#### Trades
- `GET /api/trades` - List trades
- `POST /api/trades` - Create trade
- `GET /api/trades/[id]` - Get trade
- `PUT /api/trades/[id]` - Update trade
- `DELETE /api/trades/[id]` - Delete trade
- `POST /api/trades/bulk-update` - Bulk update trades

#### Tradebook
- `GET /api/tradebook` - Get tradebook data

#### Ledger
- `GET /api/ledger` - Get ledger entries
- `POST /api/import/ledger` - Import ledger CSV

#### Import
- `POST /api/import/tradebook` - Import tradebook CSV
- `POST /api/import/ledger` - Import ledger CSV

#### Conflicts
- `GET /api/conflicts` - List conflicts
- `GET /api/conflicts/[id]` - Get conflict
- `PUT /api/conflicts/[id]` - Resolve conflict

#### Kite Integration
- `GET /api/kite/accounts` - List Kite accounts
- `POST /api/kite/auth` - Kite authentication
- `POST /api/kite/execute` - Execute Kite tool

#### Statistics
- `GET /api/stats` - Portfolio statistics

#### Tools
- `POST /api/tools/split` - Apply stock split

#### Admin
- `GET /api/admin/users` - List users
- `PATCH /api/admin/users` - Update user

## Communication Patterns

### MCP Server Communication

**Pattern**: Request-Response over stdio
**Format**: JSON-RPC 2.0

```json
Request:
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_profile",
    "arguments": {
      "client_id": "father"
    }
  }
}

Response:
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{...profile data...}"
      }
    ]
  }
}
```

### Web Application Communication

**Pattern**: RESTful HTTP
**Format**: JSON

```typescript
// Example: Fetch accounts
GET /api/accounts
Response: {
  "success": true,
  "accounts": [...]
}

// Example: Create trade
POST /api/trades
Body: {
  "accountId": 1,
  "symbol": "INFY",
  "tradeDate": "2024-01-15",
  "tradeType": "buy",
  "quantity": 10,
  "price": 1500
}
Response: {
  "success": true,
  "id": 123
}
```

### Database Communication

**Pattern**: Connection Pool with Prepared Statements
**Library**: mysql2/promise

```typescript
// Example: Query trades
const trades = await query<Trade>(
  'SELECT * FROM trades WHERE account_id = ?',
  [accountId]
);
```

## Gap Identification

The following areas require additional architectural documentation:

1. **Deployment Architecture**: Production deployment architecture, infrastructure, and scaling strategy
2. **Sequence Diagrams**: Detailed sequence diagrams for key workflows
3. **Error Handling Architecture**: Global error handling strategy and error propagation
4. **Caching Strategy**: Caching layers and cache invalidation strategies
5. **Monitoring and Logging**: Logging architecture and monitoring setup
6. **Security Architecture**: Detailed security architecture and threat model
7. **Performance Architecture**: Performance optimization strategies and bottlenecks
8. **Backup and Recovery**: Backup strategies and disaster recovery procedures

See also: [08-Special-Considerations.md](08-Special-Considerations.md) for additional considerations.

