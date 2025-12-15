# Balance Sheet Module Updates

## Summary of Changes

### 1. Bank Schema Updates
- **Removed**: `owner` field
- **Added**: 
  - `ifsc_code` (VARCHAR(11), optional)
  - `account_name` (VARCHAR(255), optional)
  - `account_number` (VARCHAR(50), optional)
- **Migration Script**: `equity/scripts/migrate-banks-schema.sql`

### 2. Recurring Transactions Enhancements
- **Duplicate Check**: Added validation to prevent adding the same recurring transaction for the same month/year
- **Display**: Shows account name and date in recurring transaction list
- **Error Message**: "This transaction has already been added for this month" when duplicate is detected

### 3. Dashboard Enhancements

#### Upcoming Recurring Transactions
- Shows upcoming recurring income and expenses (next 3 months by default)
- Displays: Category name, Account name, Month/Year, Amount
- "Add" button to quickly add recurring transactions to the current month
- Color-coded: Green for income, Red for expenses

#### Bank Balance Projections
- Shows for each bank:
  - Current Balance
  - Current Month Income
  - Current Month Expense
  - Recurring Income (from recurring transactions)
  - Recurring Expense (from recurring transactions)
  - **Projected End Balance** (calculated as: current_balance + month_income - month_expense + recurring_income - recurring_expense)
- Color-coded projected balance: Green if positive, Red if negative

### 4. API Routes Added
- `GET /api/balancesheet/upcoming-recurring` - Get upcoming recurring transactions
- `GET /api/balancesheet/bank-projections` - Get bank balance projections

### 5. Database Functions Added
- `checkDuplicateRecurringTransaction()` - Check if recurring transaction already added for a month
- `getUpcomingRecurring()` - Get upcoming recurring transactions not yet added
- `getBankBalanceProjections()` - Calculate bank balance projections

## Migration Instructions

1. **Run the bank schema migration**:
   ```sql
   -- Execute equity/scripts/migrate-banks-schema.sql
   -- Or make a POST request to /api/setup/balancesheet (if you add migration support)
   ```

2. **Update existing banks** (if any):
   - The `owner` field will be removed
   - You can add IFSC Code, Account Name, and Account Number through the UI

## Usage

### Managing Banks
1. Go to `/balancesheet/banks`
2. Add bank with only **Name** (required) and **Balance** (required)
3. Optionally add IFSC Code, Account Name, and Account Number

### Recurring Transactions
- When adding a recurring transaction to a month, the system checks for duplicates
- If already added, you'll see an error message
- On the dashboard, you can see upcoming recurring transactions and add them with one click

### Dashboard Insights
- **Upcoming Recurring**: See what income/expenses are coming up and add them quickly
- **Bank Projections**: Understand how much money you'll have at the end of the month in each bank account
- Use projections to make decisions about provisioning money for expenses



