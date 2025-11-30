# Logging and Monitoring

## Current Implementation
-   **Console Logging**: Both the MCP Server and Next.js app rely primarily on `console.log` and `console.error` output.
-   **MCP Logs**: Visible in the terminal running the server (or Claude Desktop logs).
-   **Next.js Logs**: Visible in the terminal running `npm run dev`.

## Future Improvements
-   **Structured Logging**: Implement a library like `winston` or `pino` for JSON-formatted logs.
-   **Audit Trail**: Record critical actions (Orders, Conflicts Resolved) in a specific `audit_logs` database table.

