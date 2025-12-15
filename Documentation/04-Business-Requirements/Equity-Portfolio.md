# Equity Portfolio

## Feature Description

Complete equity portfolio management including holdings tracking, trade history, XIRR calculations, and CSV import.

## User Stories

- **As a User**, I want to view my holdings so that I can see current portfolio value.
- **As a User**, I want to see my trade history so that I can track all transactions.
- **As a User**, I want to calculate XIRR so that I can measure portfolio performance.
- **As a User**, I want to import historical trades so that I can analyze long-term performance.
- **As a User**, I want to resolve import conflicts so that data integrity is maintained.

## Technical Implementation

### Holdings

**API Route**: `GET /api/stats?accountId=...`

**Features**:
- Current holdings per symbol
- Current prices (Yahoo Finance)
- Investment value vs current value
- P&L (realized + unrealized)
- Stock-level XIRR

**Calculation**:
- Holdings = Sum of buy quantities - Sum of sell quantities
- Current Value = Holdings × Current Price
- Investment = Sum of (buy quantity × price) - Sum of (sell quantity × price)

### Trade History

**API Route**: `GET /api/tradebook?accountId=...`

**Features**:
- All trades grouped by symbol
- Holdings per symbol
- Average price
- Current price
- P&L per symbol
- XIRR per symbol

### XIRR Calculation

**Library**: `xirr` npm package

**Location**: `equity/lib/xirr-calculator.ts`

**Types**:
1. **Portfolio XIRR**: Based on ledger entries (cash flows) and current portfolio value
2. **Stock XIRR**: Based on trades for a symbol and current price

**Usage**:
```typescript
import { calculatePortfolioXIRR, calculateStockXIRR } from '@/lib/xirr-calculator';

const portfolioXIRR = calculatePortfolioXIRR(ledgerEntries, currentValue);
const stockXIRR = calculateStockXIRR(trades, currentPrice, currentQuantity);
```

### CSV Import

**API Routes**: 
- `POST /api/import/tradebook` - Import tradebook CSV
- `POST /api/import/ledger` - Import ledger CSV

**Process**:
1. Parse CSV file
2. Validate each record
3. Check for duplicates (by trade_id for trades)
4. Create conflicts for mismatches
5. Insert new records
6. Update account sync timestamps

**Conflict Detection**:
- Duplicate trade_id with different data
- Missing required fields
- Invalid data formats

### Conflict Resolution

**API Route**: `GET /api/conflicts`, `PUT /api/conflicts/[id]`

**Resolution Options**:
- `resolved_keep_existing` - Keep database record
- `resolved_use_new` - Replace with CSV data
- `resolved_manual` - Manually resolved
- `ignored` - Ignore conflict

**UI**: `/conflicts` page for resolving conflicts

### Stock Split Tool

**API Route**: `POST /api/tools/split`

**Purpose**: Apply stock split to historical trades

**Process**:
1. Find all trades for symbol before split date
2. Adjust quantity and price based on split ratio
3. Update trades in database

## Database Tables

- `accounts` - Trading accounts
- `trades` - Trade records
- `ledger` - Cash flow entries
- `import_conflicts` - Import conflicts

## Files

- `equity/app/api/stats/route.ts` - Portfolio statistics
- `equity/app/api/tradebook/route.ts` - Tradebook with XIRR
- `equity/app/api/trades/route.ts` - Trade CRUD
- `equity/app/api/import/tradebook/route.ts` - Tradebook import
- `equity/app/api/import/ledger/route.ts` - Ledger import
- `equity/app/api/conflicts/route.ts` - Conflict management
- `equity/app/api/tools/split/route.ts` - Stock split tool
- `equity/lib/xirr-calculator.ts` - XIRR calculations
- `equity/lib/yahoo-finance.ts` - Price fetching

