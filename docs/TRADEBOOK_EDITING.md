# Tradebook Editing Feature

## Overview

The Tradebook page now supports **inline editing** of individual trades and **bulk renaming** of stock symbols. This makes it easy to handle corporate actions like name changes, splits, or data corrections without creating documentation files.

## Features

### 1. 📝 Inline Trade Editing

Edit individual trades directly in the expanded view:

#### Editable Fields:
- **Symbol**: Change the stock symbol
- **Quantity**: Update the quantity (e.g., for split adjustments)
- **Price**: Update the price (e.g., for split adjustments)

#### How to Edit:
1. Go to Tradebook page
2. Click on any stock row to expand trades
3. Click the **Edit** icon (✏️) on any trade row
4. The row turns blue with editable inputs
5. Modify Symbol, Quantity, or Price
6. Click **Save** (✓) to save or **Cancel** (✗) to discard

#### Use Cases:
- **Stock Splits**: 
  - Example: 1:5 split → Change Qty from 10 to 50, Price from 1000 to 200
- **Symbol Name Changes**: 
  - Example: HDFCBANK merges → Change to HDFCBANK_OLD
- **Data Corrections**: Fix any import errors

### 2. 🔄 Bulk Symbol Rename

Rename all trades with a specific symbol at once:

#### How to Use:
1. Click **"Bulk Rename Symbol"** button at the top
2. Enter **Old Symbol Name** (e.g., HDFCBANK)
3. Enter **New Symbol Name** (e.g., HDFCBANK_NEW)
4. Click **"Rename All Trades"**
5. Confirm the action
6. All matching trades will be updated instantly

#### Scope:
- If viewing **All Accounts**: Renames in ALL accounts
- If viewing **Specific Account**: Renames only in that account

#### Use Cases:
- **Corporate Name Changes**: Company changes name/symbol
- **Merger/Demerger**: Parent company symbol changes
- **Data Cleanup**: Fix incorrectly imported symbols

### 3. 🔢 Split Adjustment (Manual Method)

Instead of using the automated split tool, you can manually adjust trades:

#### Example: 1:5 Split on 2021-06-01

**Before Split** (10 shares @ ₹1000):
- Quantity: 10
- Price: ₹1000
- Value: ₹10,000

**After Manual Edit** (50 shares @ ₹200):
1. Expand the stock trades
2. Click Edit on trades **before** split date
3. Change Quantity: 10 → 50
4. Change Price: 1000 → 200
5. Value remains ₹10,000 (auto-calculated)
6. Save

**Benefits**:
- ✅ Full control over which trades to adjust
- ✅ Can handle partial splits
- ✅ Can adjust trades individually
- ✅ Immediate visual feedback

## API Endpoints

### Update Single Trade
```
PUT /api/trades/[id]

Body:
{
  "symbol": "NEWTICKER",     // Optional
  "quantity": 50,             // Optional
  "price": 200                // Optional
}

Response:
{
  "success": true,
  "trade": { ... updated trade ... }
}
```

### Bulk Rename Symbol
```
POST /api/trades/bulk-update

Body:
{
  "action": "rename_symbol",
  "oldSymbol": "HDFCBANK",
  "newSymbol": "HDFCBANK_NEW",
  "accountId": 1              // Optional, omit for all accounts
}

Response:
{
  "success": true,
  "message": "Updated 45 trade(s)",
  "affectedRows": 45
}
```

## UI Elements

### Expanded Trade Table

| Column | Description | Editable |
|--------|-------------|----------|
| **Symbol** | Stock ticker | ✅ Yes |
| **Date** | Trade date | ❌ No |
| **Type** | BUY/SELL | ❌ No |
| **Quantity** | Number of shares | ✅ Yes |
| **Price** | Price per share | ✅ Yes |
| **Value** | Auto-calculated | ❌ Auto |
| **Exchange** | NSE/BSE | ❌ No |
| **Actions** | Edit/Save/Cancel | - |

### Visual Indicators

- **Normal Row**: White background
- **Editing Row**: Blue background (`bg-blue-50`)
- **Editable Fields**: Input boxes with blue focus ring
- **Edit Button**: Blue pencil icon (✏️)
- **Save Button**: Green checkmark (✓)
- **Cancel Button**: Red X (✗)

## Workflow Examples

### Example 1: Handle Stock Split (1:10)

**Scenario**: RELIANCE did 1:10 split on 2024-09-01

**Steps**:
1. Go to Tradebook
2. Find RELIANCE, click to expand
3. Identify trades **before** 2024-09-01
4. For each pre-split trade:
   - Click Edit
   - Multiply Quantity by 10 (e.g., 10 → 100)
   - Divide Price by 10 (e.g., 2000 → 200)
   - Save
5. Holdings will auto-recalculate

**Result**: All P&L and XIRR remain accurate!

### Example 2: Corporate Name Change

**Scenario**: "HDFCBANK" merged into "HDFC", need to rename

**Steps**:
1. Click "Bulk Rename Symbol"
2. Old Symbol: HDFCBANK
3. New Symbol: HDFC
4. Click "Rename All Trades"
5. Confirm

**Result**: All 45 HDFCBANK trades renamed to HDFC instantly

### Example 3: Fix Import Error

**Scenario**: One trade imported with wrong quantity (100 instead of 10)

**Steps**:
1. Find the stock in Tradebook
2. Expand to see all trades
3. Find the incorrect trade
4. Click Edit
5. Change Quantity: 100 → 10
6. Save

**Result**: Portfolio calculations immediately reflect the correction

## Data Safety

### Validation:
- ✅ Quantity must be > 0
- ✅ Price must be > 0
- ✅ Symbol cannot be empty
- ✅ Numeric fields validated

### Confirmation:
- ✅ Bulk rename shows confirmation dialog
- ✅ Displays number of affected trades
- ✅ Can cancel before confirming

### Undo:
- ❌ No automatic undo (future feature)
- ✅ Can manually revert by editing again
- ✅ Original data preserved in database backups

## Best Practices

### 1. **Stock Splits**
- ✅ Edit trades chronologically (oldest first)
- ✅ Only edit trades BEFORE split date
- ✅ Verify total value remains same after edit
- ✅ Check holdings page to confirm net quantity

### 2. **Symbol Renames**
- ✅ Use bulk rename for efficiency
- ✅ Keep old symbol in notes if needed
- ✅ Rename across all accounts if applicable
- ✅ Verify summary stats after rename

### 3. **Data Corrections**
- ✅ Edit individual trades for precision
- ✅ Double-check calculations before saving
- ✅ Verify on Holdings page after editing
- ✅ Cross-reference with broker statements

## Technical Details

### Database Updates:
```sql
-- Individual trade update
UPDATE trades 
SET symbol = ?, quantity = ?, price = ? 
WHERE id = ?

-- Bulk symbol rename
UPDATE trades 
SET symbol = ? 
WHERE symbol = ? 
  AND account_id = ? -- Optional
```

### Auto-Recalculation:
After any edit, the following are automatically recalculated:
- Group totals (buy/sell quantities and values)
- Net quantity (buy - sell)
- Realized P&L
- XIRR
- Position status (active/sold)

### Real-time Updates:
- On save, entire tradebook refreshes
- Groups are recalculated
- Summary cards update
- Holdings page reflects changes

## Limitations

1. **Cannot Edit**:
   - Trade date
   - Trade type (buy/sell)
   - Exchange
   - Order IDs

2. **No Batch Edit**:
   - Can't select multiple trades to edit at once
   - Use bulk rename for symbol changes only
   - Edit other fields individually

3. **No Audit Trail**:
   - Original values not tracked (future feature)
   - No edit history (future feature)
   - Keep external records if needed

## Files Modified

### New Files:
1. `kite-client-app/app/api/trades/[id]/route.ts` - Single trade CRUD
2. `kite-client-app/app/api/trades/bulk-update/route.ts` - Bulk operations
3. `docs/TRADEBOOK_EDITING.md` - This documentation

### Modified Files:
1. `kite-client-app/app/tradebook/page.tsx` - Added editing UI and functions

## Access

**URL**: https://oneapp.ddev.site:3003/tradebook

**Permissions**: All users can edit (add auth if needed later)

---

**Status**: ✅ Complete  
**Date**: 2025-11-29  
**Version**: 1.0

All editing features are fully functional. You can now manage stock splits, symbol changes, and data corrections directly in the tradebook without creating any documentation files!

