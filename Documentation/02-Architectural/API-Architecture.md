# API Architecture

## Overview

The application uses RESTful API routes built with Next.js App Router Route Handlers. Additionally, there is an MCP (Model Context Protocol) server for AI-assisted operations.

## REST API Design

### Base URL

**Development**: `http://localhost:3000/api`

**Production**: `https://yourdomain.com/api`

### Authentication

**Method**: JWT tokens via NextAuth.js

**Header**: Not required (cookies used)

**Session**: HTTP-only cookie (`next-auth.session-token`)

**Validation**: All protected routes use `getServerSession(authOptions)` or `requireAuth()`

### Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message"
}
```

### Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Authorization failed
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## API Endpoints

### Authentication

#### POST /api/auth/signin
Sign in with credentials or OAuth.

#### GET /api/auth/signout
Sign out current user.

#### GET /api/auth/callback/google
Google OAuth callback.

#### GET /api/auth/session
Get current session.

### User Management

#### POST /api/register
Register new user.

**Request Body**:
```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "dob": "1990-01-01",
  "gender": "male",
  "expertise_level": "1-5"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registered. Please verify your email."
}
```

#### GET /api/verify-email?token=...
Verify email address.

### Accounts

#### GET /api/accounts
List all accounts for current user.

**Response**:
```json
{
  "success": true,
  "accounts": [
    {
      "id": 1,
      "name": "Account 1",
      "broker_id": "ZERODHA",
      "user_id": 1
    }
  ]
}
```

#### POST /api/accounts
Create new account.

**Request Body**:
```json
{
  "name": "Account Name",
  "broker_id": "ZERODHA"
}
```

#### GET /api/accounts/[id]
Get account details.

#### PUT /api/accounts/[id]
Update account.

#### DELETE /api/accounts/[id]
Delete account.

### Trades

#### GET /api/trades?accountId=...&symbol=...
List trades.

**Query Parameters**:
- `accountId` (optional) - Filter by account
- `symbol` (optional) - Filter by symbol

#### POST /api/trades
Create trade.

**Request Body**:
```json
{
  "accountId": 1,
  "symbol": "RELIANCE",
  "tradeDate": "2024-01-01",
  "tradeType": "buy",
  "quantity": 10,
  "price": 2500,
  "exchange": "NSE",
  "segment": "EQ",
  "series": "EQ"
}
```

#### GET /api/trades/[id]
Get trade details.

#### PUT /api/trades/[id]
Update trade.

#### DELETE /api/trades/[id]
Delete trade.

#### POST /api/trades/bulk-update
Bulk update trades.

### Tradebook

#### GET /api/tradebook?accountId=...
Get tradebook with holdings and XIRR.

**Response**:
```json
{
  "success": true,
  "tradebook": [
    {
      "symbol": "RELIANCE",
      "holdings": 10,
      "averagePrice": 2500,
      "currentPrice": 2600,
      "currentValue": 26000,
      "investmentValue": 25000,
      "pnl": 1000,
      "xirr": 15.5
    }
  ]
}
```

### Ledger

#### GET /api/ledger?accountId=...&fromDate=...&toDate=...
Get ledger entries.

**Query Parameters**:
- `accountId` (optional) - Filter by account
- `fromDate` (optional) - Start date (YYYY-MM-DD)
- `toDate` (optional) - End date (YYYY-MM-DD)

### Import

#### POST /api/import/tradebook
Import tradebook CSV.

**Request**: Multipart form data with CSV file

**Response**:
```json
{
  "success": true,
  "imported": 100,
  "conflicts": 5
}
```

#### POST /api/import/ledger
Import ledger CSV.

### Conflicts

#### GET /api/conflicts?accountId=...&status=...
List conflicts.

**Query Parameters**:
- `accountId` (optional) - Filter by account
- `status` (optional) - Filter by status (pending, resolved, ignored)

#### GET /api/conflicts/[id]
Get conflict details.

#### PUT /api/conflicts/[id]
Resolve conflict.

**Request Body**:
```json
{
  "resolution": "resolved_keep_existing",
  "notes": "Optional notes"
}
```

### Statistics

#### GET /api/stats?accountId=...
Get portfolio statistics.

**Response**:
```json
{
  "success": true,
  "stats": {
    "totalInvestment": 100000,
    "currentValue": 120000,
    "totalPnL": 20000,
    "xirr": 15.5,
    "holdings": [
      {
        "symbol": "RELIANCE",
        "quantity": 10,
        "averagePrice": 2500,
        "currentPrice": 2600,
        "xirr": 12.5
      }
    ]
  }
}
```

### Kite Integration

#### GET /api/kite/accounts
List Kite accounts with authentication status.

#### POST /api/kite/auth
Initiate Kite authentication.

**Request Body**:
```json
{
  "accountId": 1
}
```

**Response**:
```json
{
  "success": true,
  "loginUrl": "https://kite.zerodha.com/connect/login?..."
}
```

#### POST /api/kite/execute
Execute Kite tool.

**Request Body**:
```json
{
  "tool": "get_holdings",
  "args": {
    "account_id": 1
  }
}
```

### Balance Sheet

#### Banks

- `GET /api/balancesheet/banks` - List banks
- `POST /api/balancesheet/banks` - Create bank
- `GET /api/balancesheet/banks/[id]` - Get bank
- `PUT /api/balancesheet/banks/[id]` - Update bank
- `DELETE /api/balancesheet/banks/[id]` - Delete bank

#### Categories

- `GET /api/balancesheet/categories` - List categories
- `POST /api/balancesheet/categories` - Create category

#### Transactions

- `GET /api/balancesheet/transactions` - List transactions
- `POST /api/balancesheet/transactions` - Create transaction

#### Recurring

- `GET /api/balancesheet/recurring` - List recurring transactions
- `POST /api/balancesheet/recurring` - Create recurring transaction

#### Statistics

- `GET /api/balancesheet/stats` - Balance sheet statistics
- `GET /api/balancesheet/upcoming-recurring` - Upcoming recurring transactions
- `GET /api/balancesheet/bank-projections` - Bank balance projections

### Tools

#### POST /api/tools/split
Apply stock split to historical trades.

**Request Body**:
```json
{
  "accountId": 1,
  "symbol": "RELIANCE",
  "splitDate": "2024-01-01",
  "splitRatio": "1:2"
}
```

### Admin

#### GET /api/admin/users
List all users (admin only).

#### PATCH /api/admin/users
Update user (admin only).

**Request Body**:
```json
{
  "userId": 1,
  "role": "admin",
  "isActive": true
}
```

## MCP Protocol

### Overview

**Purpose**: Model Context Protocol server for AI-assisted trading operations

**Location**: `src/index.ts`

**Transport**: stdio (standard input/output)

**Protocol**: JSON-RPC 2.0

### Tool Categories

#### Authentication

- `list_accounts` - List configured accounts
- `login` - Initiate login (returns login URL)
- `generate_session` - Generate session from request token

#### Market Data

- `search_instruments` - Search for instruments
- `get_quotes` - Get market quotes
- `get_ltp` - Get last traded price
- `get_ohlc` - Get OHLC data
- `get_historical_data` - Get historical data

#### Trading

- `place_order` - Place order
- `modify_order` - Modify order
- `cancel_order` - Cancel order
- `get_orders` - Get orders
- `get_order_history` - Get order history
- `get_order_trades` - Get order trades

#### Portfolio

- `get_profile` - Get user profile
- `get_margins` - Get margins
- `get_holdings` - Get holdings
- `get_positions` - Get positions
- `get_mf_holdings` - Get mutual fund holdings
- `get_trades` - Get trades

#### GTT (Good Till Triggered)

- `place_gtt_order` - Place GTT order
- `modify_gtt_order` - Modify GTT order
- `delete_gtt_order` - Delete GTT order
- `get_gtts` - Get GTT orders

### MCP Request Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_holdings",
    "arguments": {
      "client_id": "account1"
    }
  }
}
```

### MCP Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{ ... data ... }"
      }
    ]
  }
}
```

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

### Error Types

1. **Validation Errors** (400):
   - Missing required fields
   - Invalid data format
   - Invalid values

2. **Authentication Errors** (401):
   - No session
   - Invalid credentials
   - Expired session

3. **Authorization Errors** (403):
   - Insufficient permissions
   - Resource ownership mismatch

4. **Not Found Errors** (404):
   - Resource doesn't exist
   - Invalid ID

5. **Server Errors** (500):
   - Database errors
   - External API errors
   - Unexpected errors

## Rate Limiting

**Current Status**: Not implemented

**Recommended**: Implement rate limiting for production

## API Versioning

**Current Status**: No versioning

**Future**: Consider `/api/v1/...` for future breaking changes

## Documentation

**Current**: This document

**Future**: Consider OpenAPI/Swagger documentation

