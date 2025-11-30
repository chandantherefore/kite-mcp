# Actors and Roles

## 1. Retail Trader (Primary User)
-   **Description**: The individual who owns the brokerage accounts (or manages family accounts).
-   **Goals**:
    -   Execute trades quickly via chat.
    -   Get instant answers about portfolio status ("How much is my Tata Power worth?").
    -   Track long-term performance (XIRR) which the broker app might not show accurately across multiple accounts.
-   **Access**: Full access to both MCP tools and Web App.

## 2. AI Assistant (System Actor)
-   **Description**: The LLM (e.g., Claude) interacting with the MCP Server.
-   **Capabilities**:
    -   Decide which tool to call based on user prompt.
    -   Format complex JSON data into readable text/tables.
    -   Provide financial advice (disclaimer: AI hallucination risk) based on data fetched.

## 3. System Admin (Developer)
-   **Description**: The user acting in a maintenance capacity.
-   **Tasks**:
    -   Setting up environment variables.
    -   Managing the MySQL database (backups, schema updates).
    -   Running the build scripts.

