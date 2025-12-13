# Security Design

## 1. Credential Storage
-   **Pattern**: Local File System Protection.
-   **Implementation**: Credentials (`api_key`, `access_token`) are stored in `~/.oneapp-credentials.json` (User's Home Directory).
-   **Access Control**: Relies on OS-level file permissions. Only the user running the process can read this file.

## 2. Environment Variables
-   **Pattern**: Configuration Injection.
-   **Implementation**: Sensitive initial configs (API Secrets) are loaded from `.env` files which are git-ignored.

## 3. API Interaction
-   **Pattern**: HTTPS / TLS.
-   **Implementation**: All communication with `kite.trade` endpoints occurs over encrypted HTTPS channels.

## 4. Database Access
-   **Pattern**: Direct Connection.
-   **Implementation**: The application connects to MySQL using provided credentials. In a production setup, this connection should be encrypted (SSL), though for localhost development it usually runs over plain TCP.

