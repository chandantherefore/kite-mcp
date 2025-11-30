# Communication Flow

## 1. MCP Tool Execution Flow

When a user asks the AI to "Buy 10 shares of Tata Motors":

1.  **Request**: AI analyzes intent and sends a JSON-RPC request to `kite-mcp-server`.
    *   Tool: `place_order`
    *   Args: `{ "tradingsymbol": "TATAMOTORS", "quantity": 10, ... }`
2.  **Authentication Check**: The server checks `sessions` map. If empty, it tries to load tokens from `~/.kite-mcp-credentials.json`.
3.  **Execution**:
    *   Server calls `kiteConnect.placeOrder()`.
    *   Kite API processes the request.
4.  **Response**:
    *   Kite API returns `order_id`.
    *   MCP Server formats this as a text response for the AI.
5.  **User Output**: AI confirms the order placement to the user.

## 2. Data Import Flow (Web App)

When a user uploads a Tradebook CSV:

1.  **Upload**: Client POSTs the file to `/api/import/tradebook`.
2.  **Parsing**: Server (`csv-parse`) reads the CSV stream.
3.  **Validation**:
    *   Check for duplicates against `trades` table (using `trade_id` or `order_id`).
4.  **Conflict Detection**:
    *   If a record exists but differs, an entry is created in `import_conflicts`.
    *   If new, it is inserted into `trades`.
5.  **Response**: JSON object returning count of inserted records and conflicts found.

## 3. XIRR Calculation Flow

1.  **Trigger**: User views Portfolio Dashboard.
2.  **Data Fetch**:
    *   Fetch all external cash flows (Deposits/Withdrawals) from `ledger`.
    *   Fetch current valuation of holdings (requires current price, potentially from manual input or API).
3.  **Computation**:
    *   Combine dates and amounts.
    *   Run `xirr()` algorithm on the series.
4.  **Render**: Display percentage return.

