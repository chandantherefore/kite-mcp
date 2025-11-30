# Introduction

## Overview

The **Kite MCP + OneApp Portfolio Manager** is a dual-system project designed to provide comprehensive trading and portfolio management capabilities for Zerodha Kite users. It integrates modern AI capabilities with traditional portfolio tracking.

The project consists of two main components:

1.  **Kite MCP Server**: A Model Context Protocol (MCP) server that exposes Zerodha Kite Connect APIs to AI assistants (like Claude Desktop). This allows users to perform trading operations, fetch market data, and analyze their portfolio using natural language.
2.  **OneApp Portfolio Manager**: A web-based (Next.js) multi-account portfolio management application. It offers features that go beyond the standard Kite web interface, such as historical tradebook import, ledger tracking, and XIRR (Extended Internal Rate of Return) calculations across multiple accounts.

## Purpose

-   **AI-Driven Trading**: Enable users to interact with their brokerage account using conversational AI.
-   **Unified Portfolio View**: Consolidate multiple family accounts (e.g., Father, Mother) into a single dashboard.
-   **Performance Analytics**: Provide accurate XIRR calculations to understand true investment performance.
-   **Data Ownership**: Store all trade and ledger data in a local MySQL database for privacy and historical analysis.

