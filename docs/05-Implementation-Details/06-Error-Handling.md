# Error Handling

## MCP Server
-   **Tool Errors**: Wrapped in `try-catch` blocks within `callTool`.
-   **Response**: Returns `{ isError: true, content: [...] }`. This signals the AI that the operation failed but allows the conversation to continue (e.g., AI can retry with different params).
-   **Auth Errors**: Specific checks for `Not authenticated`. Throws clear error messages prompting the user to use the `login` tool.

## Web App
-   **API Routes**: Return standard HTTP status codes (400 Bad Request, 401 Unauthorized, 500 Internal Server Error) with JSON error messages.
-   **Database**: `mysql2` errors (connection failed, constraint violation) are caught in `lib/db.ts` wrappers, though often bubbled up to the API layer for logging.

