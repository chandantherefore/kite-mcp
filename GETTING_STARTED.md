# Getting Started with OneApp Portfolio

## Quick Start Guide

### Prerequisites
- DDEV installed and Docker running
- Node.js 18+ (managed by DDEV)
- Your Zerodha Tradebook and Ledger CSV files

### 1. Start the Application

```bash
cd /Users/chandanchaudhary/therefore/projects/AI/kite-mcp
ddev start
```

After DDEV starts, your application will be available at:
- **Main URL**: https://oneapp.ddev.site

### 2. First-Time Setup

#### Step 1: Add Your Accounts
1. Open https://oneapp.ddev.site/settings/accounts
2. Click "Add New Account"
3. Enter account details:
   - **Name**: e.g., "Father", "Mother", "Self"
   - **Broker ID** (optional): e.g., "ZD1234"
4. Click "Create"
5. Repeat for all your accounts (you mentioned 3 accounts)

#### Step 2: Import Your Data
1. Go to https://oneapp.ddev.site/import
2. **Select an account** from the dropdown
3. **Upload Tradebook CSV**:
   - Click "Choose File" under Tradebook section
   - Select your tradebook CSV file
   - Click "Upload Tradebook"
   - Wait for confirmation message
4. **Upload Ledger CSV**:
   - Click "Choose File" under Ledger section
   - Select your ledger CSV file
   - Click "Upload Ledger"
   - Wait for confirmation message
5. **Repeat for each account**

#### Step 3: View Your Portfolio
1. Go to https://oneapp.ddev.site/dashboard
2. Use the **account switcher** dropdown to toggle between:
   - **Consolidated**: View all accounts combined
   - **Individual accounts**: View specific account data
3. Explore your portfolio metrics:
   - Total Investment
   - Current Value
   - P&L (Profit & Loss)
   - XIRR (annualized return rate)
4. Review the **Holdings Table** for stock-wise details

## CSV File Preparation

### Exporting from Zerodha

1. **Tradebook**:
   - Login to Zerodha Console
   - Go to Reports → Tradebook
   - Select date range (last 5 years)
   - Download as CSV

2. **Ledger**:
   - Login to Zerodha Console
   - Go to Reports → Account Ledger
   - Select date range (last 5 years)
   - Download as CSV

### Required CSV Format

**Tradebook must have these columns:**
```
symbol, isin, trade_date, exchange, segment, series, trade_type, 
auction, quantity, price, trade_id, order_id, order_execution_time
```

**Ledger must have these columns:**
```
particular, posting_date, cost_center, voucher_type, debit, credit, net_balance
```

Note: The order of columns doesn't matter, but all column names must match exactly (case-insensitive).

## Common Tasks

### View Consolidated Portfolio
1. Go to Dashboard
2. Select "Consolidated (All Accounts)" from dropdown
3. View combined metrics and holdings

### View Individual Account
1. Go to Dashboard
2. Select specific account from dropdown
3. View account-specific data

### Add More Data
1. Go to Import page
2. Select account
3. Upload new CSV files
4. System will handle duplicates automatically

### Edit Account Details
1. Go to Settings → Accounts
2. Click "Edit" on the account
3. Update name or broker ID
4. Click "Update"

### Hide Sensitive Data
1. On Dashboard
2. Click "Hide" button (eye icon) in top right
3. All monetary values will be masked
4. Click "Show" to reveal again

## Understanding Your Metrics

### Total Investment
The sum of all money invested in stocks (from ledger debits or calculated from trades).

### Current Value
Current market value of all holdings (quantity × current price).

### P&L (Profit & Loss)
- **Absolute**: Current Value - Total Investment
- **Percentage**: (P&L / Total Investment) × 100

### XIRR (Extended Internal Rate of Return)
Annualized rate of return considering:
- **Portfolio XIRR**: Based on all cash flows from ledger (deposits, withdrawals, charges, dividends)
- **Stock-wise XIRR**: Based on buy/sell transactions for each stock

Example: XIRR of 15.5% means your portfolio has grown at an annualized rate of 15.5%.

## Troubleshooting

### DDEV won't start
```bash
# Check if Docker is running
docker ps

# If Docker isn't running, start it
# Then try again
ddev start
```

### Can't access https://oneapp.ddev.site
```bash
# Check DDEV status
ddev describe

# Restart DDEV
ddev restart
```

### Import fails with "Invalid CSV"
- Check that CSV has all required columns
- Ensure column names match exactly
- Try opening CSV in Excel/Google Sheets to verify format
- Make sure dates are in correct format (YYYY-MM-DD)

### Database issues
```bash
# Check database
ddev mysql -e "USE oneapp; SHOW TABLES;"

# If tables are missing, recreate them
ddev mysql < .ddev/mysql/init.sql
```

### See application logs
```bash
ddev logs
```

## Stop the Application

When you're done:
```bash
ddev stop
```

To stop all DDEV projects:
```bash
ddev poweroff
```

## Next Steps

Once you have your data imported:

1. **Review accuracy**: Check if the holdings match your actual portfolio
2. **Verify XIRR**: Compare calculated XIRR with your expectations
3. **Explore holdings**: Analyze individual stock performance
4. **Compare accounts**: See which account is performing better

## Future Enhancements (Not Yet Implemented)

The following features would enhance the system but are not yet implemented:
- Live price fetching from Kite API (currently uses placeholder prices)
- Automatic data sync from Zerodha
- Charts and graphs for visualization
- Export reports as PDF
- Email notifications
- Tax harvesting insights

## Need Help?

Check these resources:
- **Requirements**: `docs/FR-001-accounts-overview.md`
- **Implementation Details**: `docs/IMPLEMENTATION_COMPLETE_V2.md`
- **DDEV Documentation**: `.ddev/README.md`

## Database Access (For Advanced Users)

```bash
# Access MySQL CLI
ddev mysql

# Use oneapp database
USE oneapp;

# View accounts
SELECT * FROM accounts;

# View trades count per account
SELECT account_id, COUNT(*) FROM trades GROUP BY account_id;

# View ledger entries
SELECT * FROM ledger ORDER BY posting_date DESC LIMIT 10;
```

---

**Happy Portfolio Tracking! 📈💰**

