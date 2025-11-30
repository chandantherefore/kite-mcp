# API Endpoints

## Next.js API Routes

The Web App exposes the following internal API endpoints:

### Accounts
-   `GET /api/accounts`: List all configured accounts.
-   `GET /api/accounts/[id]`: Get details for a specific account.

### Import & Data
-   `POST /api/import/tradebook`: Upload and process Tradebook CSV.
-   `POST /api/import/ledger`: Upload and process Ledger CSV.
-   `GET /api/conflicts/[id]`: Get import conflicts.
-   `POST /api/conflicts/[id]`: Resolve a conflict.

### Trading & Portfolio (Proxied to Kite)
-   `GET /api/kite/auth`: Auth status check.
-   `POST /api/kite/execute`: Execute orders from the Web UI (if implemented).

### Stats
-   `GET /api/stats`: Aggregated statistics for the dashboard (XIRR, Total Value).

