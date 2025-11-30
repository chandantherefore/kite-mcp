# Account Management Requirements

**ID**: FR-02
**Title**: Portfolio Tracking and Sync

## Description
Capabilities related to tracking the financial state of the accounts.

## Requirements

1.  **Data Import**:
    -   System must support importing `trades` from CSV.
    -   System must support importing `ledger` from CSV.
    -   Importer must handle date format variations if any.

2.  **Holdings Calculation**:
    -   System must derive current holdings by summing Buy quantities and subtracting Sell quantities.
    -   Average price must be calculated using FIFO or Weighted Average (implementation details in Business Logic).

3.  **Stock Splits**:
    -   System must provide a mechanism (Database function or API) to apply stock splits to historical trades to adjust quantity and price, ensuring accurate historical reporting.

4.  **Performance Metrics**:
    -   **Realized P&L**: Profit from sold assets.
    -   **Unrealized P&L**: Paper profit of current holdings.
    -   **XIRR**: Time-weighted return on investment.

