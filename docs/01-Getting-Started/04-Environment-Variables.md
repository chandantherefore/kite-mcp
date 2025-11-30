# Environment Variables

## Portfolio Manager (kite-client-app)

Create a `.env.local` file in the `kite-client-app` directory.

### Database Configuration
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_HOST` | MySQL Hostname | `localhost` |
| `DATABASE_PORT` | MySQL Port | `3306` |
| `DATABASE_USER` | Database User | `db` |
| `DATABASE_PASSWORD` | Database Password | `db` |
| `DATABASE_NAME` | Database Name | `oneapp` |

### Kite Multi-Account Configuration
The system supports dynamic loading of multiple accounts.

| Variable | Description | Example |
|----------|-------------|---------|
| `KITE_ACC_1_ID` | Unique ID for Account 1 | `father` |
| `KITE_ACC_1_NAME` | Display Name for Account 1 | `Dad's Portfolio` |
| `KITE_ACC_1_KEY` | Kite API Key for Account 1 | `abcdef123456` |
| `KITE_ACC_1_SECRET` | Kite API Secret for Account 1 | `secret123456` |

*Repeat for Account 2, 3, etc. by incrementing the number (e.g., `KITE_ACC_2_ID`).*

## MCP Server

The MCP server shares the credentials configuration logic. It typically looks for credentials in `~/.kite-mcp-credentials.json` which are generated after the login flow, but it can also read the Environment Variables if configured in the launching context.

### Credentials File
The MCP server manages a local JSON file at `~/.kite-mcp-credentials.json` containing:
-   `api_key`
-   `api_secret`
-   `access_token`
-   `request_token`

**Note**: Do not commit `.env` files or `credentials.json` to version control.

