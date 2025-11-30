# Code Structure

## Root Directory
-   `src/`: Source code for the MCP Server.
    -   `index.ts`: Main entry point and tool definitions.
-   `dist/`: Compiled JavaScript output for MCP Server.
-   `kite-client-app/`: Directory for the Next.js application.

## MCP Server (`src/`)
-   **index.ts**: Monolithic class `KiteMCPServer` containing tool schemas and handlers.
-   *(Implicit)*: `config.ts` or similar helper files if extracted.

## Portfolio App (`kite-client-app/`)
-   `app/`: Next.js App Router structure.
    -   `api/`: Backend API endpoints (`/api/kite/...`, `/api/import/...`).
    -   `dashboard/`, `holdings/`, `tradebook/`: Page routes.
-   `lib/`: Shared utilities.
    -   `db.ts`: Database connection and query helpers.
    -   `kite-service.ts`: Helper for Kite interactions from the web app.
    -   `xirr-calculator.ts`: Financial math logic.
-   `components/`: React UI components.
-   `store/`: Zustand state management (e.g., `useKiteStore.ts`).

