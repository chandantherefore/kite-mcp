# System Overview

## High-Level Architecture

The system is composed of two distinct but complementary subsystems:

1.  **The MCP Server Layer**: Acts as a bridge between Large Language Models (LLMs) and the Zerodha Kite Trading API. It allows an AI assistant to execute tools for trading and market analysis.
2.  **The Portfolio Management Application**: A user-facing web application that provides deep insights into investment performance, using a local database to store and analyze long-term data.

## Key Interactions

-   **User <-> AI Assistant**: The user queries the AI (e.g., "Buy 10 shares of INFY").
-   **AI Assistant <-> MCP Server**: The AI calls tools exposed by the MCP Server.
-   **MCP Server <-> Kite API**: The server executes the API calls to Zerodha.
-   **User <-> Web App**: The user views dashboards, imports CSVs, and tracks XIRR.
-   **Web App <-> MySQL**: The app stores accounts, trades, and ledger entries in a relational database.
-   **Web App <-> Kite API**: (Optional/Future) The web app can also connect to Kite for real-time updates, sharing the same credentials structure.

## Design Philosophy

-   **Atomic Tools**: The MCP server exposes atomic functions (place order, get quote) that the AI can chain together.
-   **Data Persistence**: The Web App focuses on data ownership. Unlike the Kite app which shows current state, this app stores historical data to calculate metrics like XIRR which require full history.
-   **Multi-Account**: Both systems are designed to handle multiple Kite accounts simultaneously, perfect for family portfolio management.

