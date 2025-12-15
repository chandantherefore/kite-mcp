# Balance Sheet

## Feature Description

Personal finance tracking including bank accounts, income/expense categories, transactions, and recurring payments.

## User Stories

- **As a User**, I want to add bank accounts so that I can track my liquid assets.
- **As a User**, I want to categorize income and expenses so that I can understand my spending.
- **As a User**, I want to record transactions so that I can track cash flow.
- **As a User**, I want to set up recurring transactions so that I can automate bill tracking.
- **As a User**, I want to see bank balance projections so that I can plan my finances.

## Technical Implementation

### Bank Management

**API Routes**: `/api/balancesheet/banks`

**Features**:
- Create, read, update, delete banks
- Track current balance
- Optional: IFSC code, account name, account number

**Database**: `bs_banks` table

### Categories

**API Routes**: `/api/balancesheet/categories`

**Features**:
- Create income/expense categories
- User-specific categories
- Unique per user (name + type)

**Database**: `bs_categories` table

### Transactions

**API Routes**: `/api/balancesheet/transactions`

**Features**:
- Record income/expense transactions
- Link to category and bank
- Date-based filtering
- User-scoped data

**Database**: `bs_transactions` table

### Recurring Transactions

**API Routes**: `/api/balancesheet/recurring`

**Features**:
- Create recurring transaction templates
- Prevent duplicate entries for same month
- Quick add to current month
- Upcoming transactions view

**Database**: `bs_recurring` table

### Dashboard Features

**API Routes**:
- `GET /api/balancesheet/upcoming-recurring` - Upcoming recurring transactions
- `GET /api/balancesheet/bank-projections` - Bank balance projections

**Upcoming Recurring**:
- Shows next 3 months of recurring transactions
- Quick "Add" button to add to current month
- Color-coded (green for income, red for expenses)

**Bank Projections**:
- Current balance
- Current month income/expense
- Recurring income/expense
- Projected end balance
- Color-coded (green if positive, red if negative)

## Database Tables

- `bs_banks` - Bank accounts
- `bs_categories` - Income/expense categories
- `bs_transactions` - Financial transactions
- `bs_recurring` - Recurring transaction templates

## Files

- `equity/app/api/balancesheet/banks/route.ts` - Bank CRUD
- `equity/app/api/balancesheet/categories/route.ts` - Category CRUD
- `equity/app/api/balancesheet/transactions/route.ts` - Transaction CRUD
- `equity/app/api/balancesheet/recurring/route.ts` - Recurring CRUD
- `equity/app/api/balancesheet/stats/route.ts` - Statistics
- `equity/app/api/balancesheet/upcoming-recurring/route.ts` - Upcoming recurring
- `equity/app/api/balancesheet/bank-projections/route.ts` - Bank projections
- `equity/lib/balancesheet-db.ts` - Database helpers

