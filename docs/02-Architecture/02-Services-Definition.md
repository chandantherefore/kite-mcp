# Services Definition

## 1. Kite MCP Server (`kite-mcp-server`)

-   **Type**: Backend Service / CLI Tool
-   **Responsibility**: Implements the Model Context Protocol to expose trading capabilities.
-   **Core Functions**:
    -   Session Management (Login, Token generation).
    -   Order Management (Place, Modify, Cancel, GTT).
    -   Portfolio Queries (Holdings, Positions).
    -   Market Data (Quotes, OHLC, Historical).
-   **State**: Stateless logic, but persists authentication tokens in `~/.kite-mcp-credentials.json`.

## 2. Portfolio Manager Web App (`equity`)

-   **Type**: Full Stack Web Application (Next.js)
-   **Responsibility**: Visual interface for portfolio tracking and data import.
-   **Core Functions**:
    -   **Dashboard**: Visual overview of net worth and daily P&L.
    -   **Importer**: Parse and validate Tradebook/Ledger CSVs from Zerodha.
    -   **Analytics Engine**: Calculate XIRR and absolute returns.
    -   **Account Manager**: CRUD operations for multiple user accounts.
-   **State**: Stateful, relies on MySQL database.

## 3. MySQL Database

-   **Type**: Relational Database
-   **Responsibility**: Persistent storage for business data.
-   **Core Entities**:
    -   `accounts`: User profiles/accounts.
    -   `trades`: Historical trade records.
    -   `ledger`: Financial transactions (deposits, withdrawals, charges).
    -   `import_conflicts`: Temporary storage for data reconciliation during imports.

