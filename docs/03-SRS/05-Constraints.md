# Constraints

## 1. Zerodha Kite API Limits
-   **Rate Limiting**: 3 requests per second per API key. The MCP server does not currently implement a queue, so the user/AI must not spam requests.
-   **Session Expiry**: Access tokens are valid only for one trading day. Re-login is required every morning.

## 2. Deployment Environment
-   **Localhost**: The system is designed primarily for local usage. Deployment to a public server would require adding Authentication/Authorization layers (OAuth/Auth.js) to the Web App, which are currently not implemented (it assumes local trust).

## 3. Database
-   **MySQL Requirement**: The app is hardcoded to use MySQL (`mysql2`). Migration to Postgres or SQLite would require rewriting `lib/db.ts`.

