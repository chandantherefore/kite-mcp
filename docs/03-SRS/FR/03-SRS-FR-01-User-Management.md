# User Management Requirements

**ID**: FR-01
**Title**: User and Account Configuration

## Description
The system acts as a single-user application but manages multiple brokerage profiles (sub-accounts).

## Requirements

1.  **Configuration File**:
    -   Users must be able to define accounts in a `.env` or `.env.local` file.
    -   Each account must have a unique identifier (ID), display name, API Key, and API Secret.

2.  **Account Selection**:
    -   **MCP**: Tools must accept an optional `client_id` parameter. If missing and multiple accounts exist, the system must prompt for clarification.
    -   **Web App**: The UI must provide a switcher (dropdown/tabs) to toggle the view between different accounts.

3.  **Security**:
    -   Credentials must never be exposed in the browser client (handled server-side in Next.js or local Node process).

