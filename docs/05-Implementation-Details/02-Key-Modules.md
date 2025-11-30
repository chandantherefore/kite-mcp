# Key Modules

## 1. KiteMCPServer (`src/index.ts`)
The core of the MCP integration.
-   **Class**: `KiteMCPServer`
-   **Key Methods**:
    -   `setupHandlers()`: Registers `ListTools` and `CallTool` handlers.
    -   `handlePlaceOrder()`, `handleGetHoldings()`: Implementation of specific tools.
    -   `loadCredentials()`, `saveCredentials()`: Manages the JSON persistence.

## 2. Database Layer (`lib/db.ts`)
A thin wrapper around `mysql2` pool.
-   **Exports**: `query`, `insert`, `execute`, `transaction`.
-   **Helpers**: `db.getTrades()`, `db.insertTrade()`, `db.getConflicts()`.
-   **Type Safety**: Interfaces `Account`, `Trade`, `Ledger` defined here matching DB schema.

## 3. Kite Service (`lib/kite-service.ts`)
Used by the Web App to communicate with Kite.
-   **Function**: Manages instances of `KiteConnect` for different accounts configured in `.env`.
-   **Difference from MCP**: This runs inside the Next.js server context, whereas MCP runs in its own process. They share the concept of accounts but currently maintain separate session states (Web App config vs MCP JSON file).

