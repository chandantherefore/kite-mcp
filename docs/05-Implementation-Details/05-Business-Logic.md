# Business Logic

## 1. Import Deduplication
When importing trades:
1.  The system checks if a trade with the same `order_id` (or `trade_id` if available) exists.
2.  If it exists, it compares key fields (Quantity, Price, Symbol).
3.  If fields differ, it raises a **Conflict**.
4.  If fields match, it skips (Idempotent).

## 2. XIRR Calculation
1.  **Cash Outflows**: Every 'Buy' is treated as a cash outflow (negative) at `trade_date` (Approximation if Ledger not used).
2.  **Cash Inflows**: Every 'Sell' is a cash inflow (positive).
3.  **Terminal Value**: The current value of holdings (Quantity * CMP) is treated as a cash inflow occurring *today*.
4.  **Formula**: `XIRR(dates, amounts)` is solved numerically (Newton-Raphson method usually implemented by the library).

## 3. Stock Splits
When a split occurs (e.g., 1:2):
1.  The user/admin initiates a split action for Symbol S on Date D with Ratio R.
2.  Logic updates all **historical** trades for Symbol S where `trade_date < D`.
3.  `Quantity = Quantity * R`
4.  `Price = Price / R`
This ensures that historical cost basis aligns with current market price for accurate P&L.

