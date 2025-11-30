# Functional Requirements

## 1. Authentication & Session Management
-   **FR-1.1**: System must allow login via Kite Connect API Key/Secret.
-   **FR-1.2**: System must handle the request token -> access token exchange.
-   **FR-1.3**: System must persist valid sessions to avoid frequent logins.
-   **FR-1.4**: System must support multiple concurrent accounts identified by unique IDs.

## 2. Order Execution
-   **FR-2.1**: Support placement of Regular, AMO, and CO orders.
-   **FR-2.2**: Support validation of inputs (quantity > 0, valid exchange).
-   **FR-2.3**: Provide feedback on order status (success/failure/rejection reason).

## 3. Data Management (Web App)
-   **FR-3.1**: Allow upload of CSV files.
-   **FR-3.2**: Parse "Tradebook" CSV format specifically from Zerodha.
-   **FR-3.3**: Detect duplicates during import to prevent data corruption.
-   **FR-3.4**: Provide a UI to resolve conflicts (e.g., keep existing vs. overwrite).

## 4. Analytics
-   **FR-4.1**: Calculate current holdings based on trade history.
-   **FR-4.2**: Calculate XIRR based on ledger cash flows and current portfolio value.

