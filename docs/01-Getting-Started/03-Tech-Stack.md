# Tech Stack

## Core Technologies

### Backend / MCP Server
-   **Language**: TypeScript
-   **Runtime**: Node.js
-   **Framework**: [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk) (`@modelcontextprotocol/sdk`)
-   **Kite API**: `kiteconnect` (Official Node.js client)

### Frontend / Portfolio Manager
-   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
-   **Language**: TypeScript
-   **UI Library**: React 18
-   **Styling**: Tailwind CSS
-   **State Management**: Zustand
-   **Icons**: Lucide React

### Database & Data
-   **Database**: MySQL
-   **Driver**: `mysql2` (with promise support)
-   **CSV Processing**: `csv-parse` (For importing Tradebook/Ledger)
-   **Financial Math**: `xirr` (For return calculations)

### Development Tools
-   **Linter**: ESLint
-   **Formatter**: Prettier (implied)
-   **Build Tool**: `tsc` (TypeScript Compiler) and Next.js Build

