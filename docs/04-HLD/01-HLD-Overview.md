# High Level Design Overview

The system follows a **Service-Oriented Architecture** (SOA) locally, where the "services" are distinct processes running on the user's machine.

## Core Components

1.  **MCP Server Node Process**:
    -   **Input**: STDIN (JSON-RPC messages from AI).
    -   **Processing**: Route requests to `KiteConnect` library.
    -   **Storage**: JSON file for session tokens.
    -   **Output**: STDOUT (JSON-RPC responses).

2.  **Next.js Web Server**:
    -   **Frontend**: React Server Components & Client Components.
    -   **Backend API**: Next.js API Routes (`app/api/...`) handling DB operations.
    -   **Storage**: MySQL Database.

## Design Decisions

-   **Separate Processes**: Kept separate to allow the MCP server to be lightweight and usable without running the full Web UI if desired.
-   **Direct DB Access**: The Next.js app accesses MySQL directly via a connection pool, avoiding the need for an intermediate ORM layer for simplicity and performance in this specific scope.
-   **Stateless API Routes**: API routes in Next.js are stateless; they authenticate requests implicitly (local trust) or via session cookies if extended.

