# Non-Functional Requirements

## 1. Performance
-   **MCP Response Time**: Tools should respond within 2 seconds (dependent on Kite API latency).
-   **Database Queries**: Portfolio dashboard should load in under 1 second for datasets < 10,000 trades.

## 2. Reliability
-   **Session Recovery**: The system should automatically attempt to use stored tokens before asking for login.
-   **Data Integrity**: Database transactions must be used when importing batches of trades to prevent partial updates.

## 3. Usability
-   **API Tool Descriptions**: Must be verbose enough for the LLM to understand usage without hallucinating parameters.
-   **Web UI**: Must be responsive (mobile-friendly) using Tailwind CSS classes.

## 4. Maintainability
-   **Code Structure**: Separation of concerns (MCP Server vs. Next.js Client).
-   **Type Safety**: Strict TypeScript usage across the codebase.

