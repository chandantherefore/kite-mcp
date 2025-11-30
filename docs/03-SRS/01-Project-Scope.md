# Project Scope

## In Scope

### 1. Trading Interface (via MCP)
-   Full execution capability: Buy, Sell, Modify, Cancel.
-   Order types: Market, Limit, SL, SL-M.
-   Advanced orders: GTT, AMO, Iceberg.
-   Market data queries: LTP, OHLC, Market Depth (Quotes).
-   Historical data retrieval.

### 2. Portfolio Management (Web App)
-   Multi-account configuration and switching.
-   Importing historical data from Zerodha standard CSV exports (Tradebook, Ledger).
-   Tracking holdings quantity and average price.
-   Calculating XIRR (Extended Internal Rate of Return).
-   Handling stock splits and adjustments manually or via tools.
-   Conflict resolution for data imports.

### 3. Security & Privacy
-   Local storage of API credentials.
-   Local database for financial history.
-   No external data transmission except to the Broker API.

## Out of Scope

-   **Algorithmic Trading Engine**: This is a toolset, not a strategy runner (though the AI can act as one).
-   **Payment Gateway**: Funds must be added via the official Zerodha app.
-   **Social Sharing**: No social features or public sharing of portfolios.
-   **Real-time Streaming**: The current implementation relies on polling or request-response, not WebSocket streaming (though Kite supports it).

