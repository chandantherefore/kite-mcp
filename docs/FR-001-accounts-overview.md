# FR-001: Multi-Account Portfolio Management with Import Feature

## Overview

This feature request implements a comprehensive portfolio management system for tracking 3 Zerodha Kite accounts with historical data import capabilities. The system will support CSV imports of tradebook and ledger data spanning 5 years, calculate consolidated and individual performance metrics (including XIRR), and provide a unified dashboard view.

## Business Requirements

### 1. Account Management
- Support for managing multiple Zerodha accounts (initially 3)
- CRUD operations for accounts via UI
- Each account has: ID, Name, Broker ID, creation date
- Ability to switch between consolidated view and individual account views

### 2. Data Import
- **Tradebook Import**: CSV upload with the following columns:
  - `symbol`: Trading symbol (e.g., INFY, SBIN)
  - `isin`: ISIN code
  - `trade_date`: Date of trade
  - `exchange`: Exchange (NSE, BSE, etc.)
  - `segment`: Market segment
  - `series`: Series (EQ, etc.)
  - `trade_type`: BUY/SELL
  - `auction`: Auction flag
  - `quantity`: Number of shares
  - `price`: Trade price
  - `trade_id`: Unique trade identifier
  - `order_id`: Order identifier
  - `order_execution_time`: Execution timestamp

- **Ledger Import**: CSV upload with the following columns:
  - `particular`: Transaction description
  - `posting_date`: Date of posting
  - `cost_center`: Cost center identifier
  - `voucher_type`: Type of voucher
  - `debit`: Debit amount
  - `credit`: Credit amount
  - `net_balance`: Running balance

- User selects account before uploading data
- Support for historical data (5+ years)
- Duplicate detection and handling

### 3. Portfolio Analytics

#### Consolidated View
- Total portfolio valuation across all accounts
- Consolidated XIRR (using ledger cash flows)
- Top holdings across all accounts
- Overall P&L

#### Individual Account View
- Account-specific portfolio valuation
- Individual XIRR per account
- Account-specific holdings and P&L

#### Stock-wise Analysis
- XIRR per stock/symbol
- Current holdings vs historical trades
- Realized and unrealized P&L per stock

### 4. Dashboard Features
- Account switcher dropdown (Consolidated / Account 1 / Account 2 / Account 3)
- Current portfolio value (fetched from live Kite APIs)
- Performance metrics:
  - Total investment (from ledger debits)
  - Current value
  - Absolute returns
  - XIRR (%)
- Holdings table with:
  - Symbol
  - Quantity
  - Average cost
  - Current price
  - P&L (absolute & percentage)
  - Stock-wise XIRR

## Technical Requirements

### 1. Infrastructure
- **DDEV Project**: `oneapp`
  - MySQL 8.0 (or MariaDB)
  - Node.js 18+ service
  - Next.js application served from DDEV web container
- Database: MySQL/MariaDB
- Backend: Next.js API routes
- Frontend: Next.js with React

### 2. Database Schema

#### `accounts` Table
```sql
CREATE TABLE accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  broker_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `trades` Table
```sql
CREATE TABLE trades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  isin VARCHAR(20),
  trade_date DATE NOT NULL,
  exchange VARCHAR(20),
  segment VARCHAR(20),
  series VARCHAR(10),
  trade_type ENUM('buy', 'sell') NOT NULL,
  auction BOOLEAN DEFAULT FALSE,
  quantity DECIMAL(15, 4) NOT NULL,
  price DECIMAL(15, 4) NOT NULL,
  trade_id VARCHAR(100),
  order_id VARCHAR(100),
  order_execution_time DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_account_symbol (account_id, symbol),
  INDEX idx_trade_date (trade_date),
  UNIQUE KEY unique_trade (account_id, trade_id)
);
```

#### `ledger` Table
```sql
CREATE TABLE ledger (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  particular TEXT,
  posting_date DATE NOT NULL,
  cost_center VARCHAR(100),
  voucher_type VARCHAR(50),
  debit DECIMAL(15, 2) DEFAULT 0,
  credit DECIMAL(15, 2) DEFAULT 0,
  net_balance DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_account_date (account_id, posting_date)
);
```

### 3. API Endpoints

#### Account Management
- `POST /api/accounts` - Create account
- `GET /api/accounts` - List all accounts
- `GET /api/accounts/[id]` - Get account details
- `PUT /api/accounts/[id]` - Update account
- `DELETE /api/accounts/[id]` - Delete account

#### Data Import
- `POST /api/import/tradebook` - Upload tradebook CSV
  - Request: `multipart/form-data` with `file` and `accountId`
  - Response: Import summary (rows processed, errors)
- `POST /api/import/ledger` - Upload ledger CSV
  - Request: `multipart/form-data` with `file` and `accountId`
  - Response: Import summary

#### Analytics
- `GET /api/stats?accountId=[id]` - Get portfolio stats
  - If `accountId` omitted or "consolidated": return consolidated stats
  - If specific `accountId`: return account-specific stats
  - Response includes:
    - Total investment
    - Current value
    - XIRR
    - Holdings with P&L
    - Stock-wise XIRR

- `GET /api/holdings?accountId=[id]` - Get current holdings
- `GET /api/trades?accountId=[id]&symbol=[symbol]` - Get trade history

### 4. Frontend Components

#### Pages
- `/settings/accounts` - Account management (CRUD)
- `/import` - CSV import interface
- `/dashboard` - Main portfolio dashboard (updated)
- `/holdings` - Holdings view (updated to support account switching)

#### Components
- `AccountSwitcher` - Dropdown to switch between consolidated/individual views
- `AccountManager` - CRUD interface for accounts
- `ImportForm` - File upload with account selection
- `PortfolioSummary` - Key metrics display
- `HoldingsTable` - Stock-wise holdings with XIRR
- `StatsCard` - Metric cards (investment, value, returns, XIRR)

### 5. NPM Dependencies
- `mysql2` - MySQL database driver
- `csv-parse` - CSV parsing library
- `xirr` - XIRR calculation library
- Existing: `next`, `react`, `react-dom`, `kiteconnect`

## XIRR Calculation Logic

### Consolidated XIRR
1. Extract all cash flows from ledger table (all accounts)
2. Debits = negative cash flows (investments)
3. Credits = positive cash flows (withdrawals)
4. Final value = current portfolio value (from live Kite API)
5. Calculate XIRR using dates and amounts

### Individual Account XIRR
- Same as consolidated but filtered by `account_id`

### Stock-wise XIRR
1. Extract all buy/sell transactions for a symbol
2. Buy trades = negative cash flows (quantity × price)
3. Sell trades = positive cash flows (quantity × price)
4. Final value = current holdings quantity × current price
5. Calculate XIRR for that symbol

## User Flow

### Initial Setup
1. User accesses `/settings/accounts`
2. Adds 3 accounts with names (e.g., "Father", "Mother", "Self")
3. Accounts are saved to database

### Data Import
1. User navigates to `/import`
2. Selects account from dropdown
3. Uploads Tradebook CSV
4. Uploads Ledger CSV
5. System processes and stores data
6. Repeats for other accounts

### Viewing Portfolio
1. User navigates to `/dashboard`
2. Default view: Consolidated (all accounts)
3. Uses AccountSwitcher to select specific account
4. Dashboard updates to show:
   - Portfolio value
   - XIRR
   - Holdings table with stock-wise XIRR
   - P&L metrics

## Success Criteria
- [ ] DDEV setup working with MySQL and Next.js
- [ ] All 3 accounts can be added via UI
- [ ] Tradebook and Ledger CSVs can be imported without errors
- [ ] Data persists in MySQL database
- [ ] Consolidated XIRR calculated correctly
- [ ] Individual account XIRR calculated correctly
- [ ] Stock-wise XIRR displayed in holdings table
- [ ] Account switcher changes dashboard view
- [ ] Live prices integrated from Kite API

## Future Enhancements
- Automatic daily data sync from Kite API
- Portfolio rebalancing suggestions
- Tax harvesting insights
- Advanced charting and visualization
- Email alerts for portfolio changes
- Support for more brokers

## Notes
- Ledger data is critical for accurate XIRR (captures dividends, charges, deposits, withdrawals)
- Tradebook alone would give approximate XIRR based only on buy/sell transactions
- Both data sources together provide comprehensive portfolio tracking
