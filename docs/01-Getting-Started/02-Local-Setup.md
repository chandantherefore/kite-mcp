# Local Setup

## Prerequisites

Before running the project, ensure you have the following installed:

1.  **Node.js**: Version 18.0.0 or higher (Required for both MCP Server and Next.js App).
2.  **npm**: Node Package Manager (usually bundled with Node.js).
3.  **MySQL**: Version 8.0 or higher (Required for the Portfolio Manager database).
4.  **Git**: For version control.

## External Services

1.  **Zerodha Kite Connect Account**:
    *   You need an API Key and API Secret.
    *   Ensure you have a valid subscription to the Kite Connect API.

2.  **Claude Desktop (Optional)**:
    *   To use the MCP Server capabilities with an AI assistant.

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd kite-mcp
```

### 2. Setup MCP Server (Root Directory)

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### 3. Setup Portfolio Manager (kite-client-app)

```bash
cd kite-client-app

# Install dependencies
npm install
```

### 4. Database Setup

1.  Create a MySQL database (e.g., `oneapp`).
2.  Create a user with permissions to access this database.
3.  (Optional) The application will handle table creation on startup if configured, or you may need to run migration scripts if provided in `lib/db.ts` context.

## Configuration

You will need to configure environment variables for both the MCP Server and the Client App. See `04-Environment-Variables.md` for details.

