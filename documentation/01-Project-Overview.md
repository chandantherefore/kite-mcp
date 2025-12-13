# Project Overview

## Table of Contents

1. [Project Description](#project-description)
2. [Purpose and Goals](#purpose-and-goals)
3. [Key Features](#key-features)
4. [Target Users](#target-users)
5. [Project Structure](#project-structure)
6. [Gap Identification](#gap-identification)

## Project Description

The **Kite MCP Server + OneApp Portfolio Manager** is a comprehensive trading and portfolio management system that integrates two main components:

1. **Kite MCP Server**: A Model Context Protocol (MCP) server that provides programmatic access to Zerodha Kite Connect trading APIs, enabling AI assistants and automated trading systems to interact with the Kite platform.

2. **OneApp Portfolio Manager**: A modern web application built with Next.js for managing multiple Zerodha trading accounts, importing historical trade data, calculating portfolio performance metrics (including XIRR), and providing consolidated views across accounts.

### Project Name
- **Full Name**: Kite MCP Server + OneApp Portfolio Manager
- **Short Name**: kite-mcp
- **Version**: 1.0.0 (MCP Server), 0.1.0 (Portfolio Manager)

## Purpose and Goals

### Primary Purpose

The project aims to:

1. **Enable AI-Assisted Trading**: Provide a standardized MCP interface for AI assistants to interact with Zerodha Kite Connect APIs, making trading operations accessible through natural language interfaces.

2. **Multi-Account Portfolio Management**: Allow users to manage and analyze multiple Zerodha trading accounts from a single unified interface. Each user can only access and manage their own accounts, ensuring complete data isolation and security.

3. **Historical Data Analysis**: Enable import and analysis of historical trade data (5+ years) from CSV exports, providing insights into long-term portfolio performance.

4. **Performance Tracking**: Calculate and display XIRR (Extended Internal Rate of Return) at both portfolio and individual stock levels, providing accurate annualized return metrics.

5. **Data Consolidation**: Provide consolidated views of holdings, positions, and performance metrics across all managed accounts.

### Business Goals

<!-- TODO: [GAP] Add specific business requirements, success metrics, and KPIs -->

- **User Adoption**: Target number of active users
- **Performance Metrics**: Expected response times and system availability
- **Data Accuracy**: Requirements for trade data import accuracy
- **Scalability**: Expected number of accounts and trades to support

## Key Features

### Kite MCP Server Features

#### Authentication & Account Management
- Multi-account support with configurable account identifiers
- Secure credential storage in `~/.kite-mcp-credentials.json`
- OAuth-based authentication flow with Kite Connect
- Session management with automatic token refresh

#### Market Data Tools
- **Search Instruments**: Search and filter trading instruments by symbol, name, ISIN, or underlying
- **Get Quotes**: Retrieve complete market data snapshot (up to 500 instruments)
- **Get OHLC**: Open, High, Low, Close data for instruments
- **Get LTP**: Latest trading prices
- **Get Historical Data**: Historical candle data with multiple intervals (minute, day, 3minute, 5minute, 10minute, 15minute, 30minute, 60minute)

#### Trading Tools
- **Place Order**: Support for multiple order types (MARKET, LIMIT, SL, SL-M)
- **Modify Order**: Update existing orders
- **Cancel Order**: Cancel pending orders
- **Order Varieties**: Regular, CO (Cover Order), AMO (After Market Order), Iceberg, Auction
- **Order Management**: View orders, order history, and order trades

#### Portfolio Tools
- **Get Holdings**: View equity holdings with P&L information
- **Get Positions**: View current positions (net and day positions)
- **Get MF Holdings**: View mutual fund holdings
- **Get Trades**: Trading history with pagination support
- **Get Margins**: Account margin details (equity and commodity)

#### GTT (Good Till Triggered) Orders
- **Place GTT**: Create single-leg or two-leg GTT orders
- **Modify GTT**: Update existing GTT orders
- **Delete GTT**: Remove GTT orders
- **Get GTTs**: List all active GTT orders

### OneApp Portfolio Manager Features

#### User Management
- **User Registration**: Comprehensive registration with profile information
- **Email Verification**: Email-based account verification system
- **Google OAuth**: One-click sign-in with Google accounts
- **Role-Based Access**: User and admin roles with different permissions
- **Admin Panel**: User management interface for administrators

#### Account Management (User-Specific)
- **Multi-Account Support**: Create and manage multiple trading accounts
- **Account Configuration**: Link accounts with broker IDs
- **Account Statistics**: Track last sync times and record counts

#### Data Import
- **Tradebook Import**: Import historical trade data from CSV files
- **Ledger Import**: Import ledger/transaction data from CSV files
- **Conflict Detection**: Automatic detection of duplicate or conflicting records
- **Batch Processing**: UUID-based batch tracking for imports
- **Data Validation**: Comprehensive validation of imported data

#### Portfolio Analytics
- **Holdings View**: Display current holdings with P&L calculations
- **Positions View**: View open positions across accounts
- **Dashboard**: Consolidated view of portfolio performance
- **XIRR Calculation**: Portfolio and stock-level XIRR calculations
- **Consolidated Views**: Aggregate data across multiple accounts
- **Individual Account Views**: Filter by specific account

#### Data Management
- **Tradebook Management**: View, edit, and manage trade records
- **Ledger Management**: View and manage ledger entries
- **Conflict Resolution**: Resolve import conflicts with multiple resolution strategies
- **Stock Split Tool**: Apply stock splits to historical trade data

#### Live Data Integration
- **Kite Connect Integration**: Fetch live holdings, positions, and margins from Kite
- **Real-time Updates**: Refresh live data from connected Kite accounts
- **Consolidated Live View**: Aggregate live data across multiple accounts

## Target Users

### Primary Users

1. **Traders and Investors**
   - Manage multiple trading accounts
   - Track portfolio performance over time
   - Analyze historical trading data
   - Calculate accurate returns (XIRR)

2. **AI Assistant Users**
   - Interact with Kite trading APIs through natural language
   - Execute trading operations via AI assistants
   - Query market data and portfolio information

3. **Portfolio Managers**
   - Monitor multiple client accounts
   - Generate consolidated reports
   - Analyze performance across accounts

### Secondary Users

1. **Developers**
   - Integrate Kite APIs into custom applications
   - Build trading automation systems
   - Create portfolio analysis tools

2. **Administrators**
   - Manage user accounts
   - Monitor system usage
   - Resolve data conflicts

<!-- TODO: [GAP] Add user personas with detailed descriptions -->

## Project Structure

### Directory Structure

```
kite-mcp/
├── src/                          # MCP Server source code
│   ├── index.ts                  # Main MCP server implementation
│   └── config.ts                 # Configuration management
├── dist/                         # Compiled JavaScript (generated)
├── equity/              # Next.js Portfolio Manager application
│   ├── app/                      # Next.js app directory
│   │   ├── api/                  # API routes
│   │   ├── admin/                # Admin pages
│   │   ├── dashboard/            # Dashboard page
│   │   ├── holdings/             # Holdings page
│   │   ├── import/                # Import page
│   │   └── ...                    # Other pages
│   ├── lib/                      # Core libraries
│   │   ├── db.ts                 # Database operations
│   │   ├── kite-service.ts       # Kite API integration
│   │   └── xirr-calculator.ts    # XIRR calculations
│   ├── components/               # React components
│   ├── store/                    # State management (Zustand)
│   └── middleware.ts             # Next.js middleware
├── documentation/                # This documentation
├── docs/                         # Existing documentation (preserved)
├── .ddev/                        # DDEV configuration
│   └── mysql/                    # Database initialization scripts
├── package.json                  # Root package.json (MCP Server)
└── README.md                     # Main project README
```

### Key Files

#### MCP Server
- `src/index.ts`: Main server implementation with all MCP tool handlers
- `src/config.ts`: Multi-account configuration loader
- `package.json`: MCP server dependencies and scripts

#### Portfolio Manager
- `equity/app/layout.tsx`: Root layout with navigation
- `equity/lib/db.ts`: Database models and operations
- `equity/lib/kite-service.ts`: Kite API service wrapper
- `equity/middleware.ts`: Authentication middleware
- `equity/app/api/auth/[...nextauth]/route.ts`: NextAuth configuration

### Database Structure

The application uses MySQL with the following main tables:
- `users`: User accounts and authentication
- `accounts`: Trading accounts
- `trades`: Trade records
- `ledger`: Ledger/transaction records
- `import_conflicts`: Import conflict tracking

<!-- TODO: [GAP] Add detailed database schema documentation (see 03-Data-Modeling.md) -->

## Gap Identification

The following areas require additional information or developer input:

1. **Business Requirements**: Specific business requirements, success metrics, and KPIs
2. **User Personas**: Detailed user personas with use cases
3. **Roadmap**: Future development roadmap and planned features
4. **Performance Targets**: Specific performance requirements and SLAs
5. **Scalability Requirements**: Expected scale (number of users, accounts, trades)
6. **Compliance**: Regulatory compliance requirements (if any)
7. **Security Requirements**: Detailed security requirements and threat model
8. **Deployment Strategy**: Production deployment strategy and infrastructure

See also: [08-Special-Considerations.md](08-Special-Considerations.md) for additional considerations.

