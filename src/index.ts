#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { KiteConnect } from "kiteconnect";
import { promises as fs } from "fs";
import { homedir } from "os";
import path from "path";
import { fileURLToPath } from 'url';
import { loadAccountsConfig, getAccountConfig, getAccountsList, KiteAccountConfig } from './config.js';

interface KiteCredentials {
    api_key?: string;
    api_secret?: string;
    access_token?: string;
    request_token?: string;
}

interface KiteSession {
    kc: any; // KiteConnect instance
    credentials: KiteCredentials;
}

// Path to store credentials (now supports multiple accounts)
const CREDENTIALS_PATH = path.join(homedir(), ".kite-mcp-credentials.json");

export class KiteMCPServer {
    private server: Server;
    private sessions: Map<string, KiteSession> = new Map();
    private accountConfigs: KiteAccountConfig[] = [];

    constructor() {
        this.server = new Server(
            {
                name: "kite-mcp-server",
                version: "1.0.0",
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.accountConfigs = loadAccountsConfig();
        this.setupHandlers();
        this.loadCredentials();
    }

    private async loadCredentials(): Promise<void> {
        try {
            const data = await fs.readFile(CREDENTIALS_PATH, "utf-8");
            const savedSessions: Record<string, KiteCredentials> = JSON.parse(data);

            // Restore sessions for each account
            for (const [clientId, credentials] of Object.entries(savedSessions)) {
                if (credentials.api_key) {
                    const kc = new KiteConnect({ api_key: credentials.api_key });

                    if (credentials.access_token) {
                        kc.setAccessToken(credentials.access_token);
                    }

                    this.sessions.set(clientId, { kc, credentials });
                }
            }
        } catch (error) {
            // Credentials file doesn't exist yet, will be created on login
        }
    }

    private async saveCredentials(): Promise<void> {
        const credentialsMap: Record<string, KiteCredentials> = {};

        for (const [clientId, session] of this.sessions.entries()) {
            credentialsMap[clientId] = session.credentials;
        }

        await fs.writeFile(
            CREDENTIALS_PATH,
            JSON.stringify(credentialsMap, null, 2),
            "utf-8"
        );
    }

    private setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            const tools: Tool[] = [
                {
                    name: "list_accounts",
                    description:
                        "List all available Kite accounts configured in the system. Returns account IDs and display names. Use this to show available accounts to the user.",
                    inputSchema: {
                        type: "object",
                        properties: {},
                    },
                },
                {
                    name: "login",
                    description:
                        "Login to Kite API for a specific account. This tool helps you log in to the Kite API. If you are starting off a new conversation call this tool before hand. Call this if you get a session error. Returns a link that the user should click to authorize access, present as markdown if your client supports so that they can click it easily when rendered.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            client_id: {
                                type: "string",
                                description: "Account identifier (e.g., 'father', 'mother')",
                            },
                            api_key: {
                                type: "string",
                                description: "Your Kite Connect API key (optional if configured in env)",
                            },
                            api_secret: {
                                type: "string",
                                description: "Your Kite Connect API secret (optional if configured in env)",
                            },
                        },
                        required: ["client_id"],
                    },
                },
                {
                    name: "generate_session",
                    description:
                        "Generate session using request token. After user authorizes, call this with the request_token from the redirect URL to complete authentication.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            client_id: {
                                type: "string",
                                description: "Account identifier (e.g., 'father', 'mother')",
                            },
                            request_token: {
                                type: "string",
                                description: "Request token from redirect URL",
                            },
                        },
                        required: ["client_id", "request_token"],
                    },
                },
                {
                    name: "get_profile",
                    description:
                        "Retrieve the user's profile information, including user ID, name, email, and account details like products orders, and exchanges available to the user. Use this to get basic user details.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            client_id: {
                                type: "string",
                                description: "Account identifier (optional if only one account)",
                            },
                        },
                    },
                },
                {
                    name: "get_margins",
                    description: "Get margins",
                    inputSchema: {
                        type: "object",
                        properties: {
                            client_id: {
                                type: "string",
                                description: "Account identifier (optional if only one account)",
                            },
                        },
                    },
                },
                {
                    name: "place_order",
                    description: "Place an order",
                    inputSchema: {
                        type: "object",
                        properties: {
                            variety: {
                                type: "string",
                                enum: ["regular", "co", "amo", "iceberg", "auction"],
                                default: "regular",
                                description: "Order variety",
                            },
                            exchange: {
                                type: "string",
                                enum: ["NSE", "BSE", "MCX", "NFO", "BFO"],
                                default: "NSE",
                                description: "The exchange to which the order should be placed",
                            },
                            tradingsymbol: {
                                type: "string",
                                description: "Trading symbol",
                            },
                            transaction_type: {
                                type: "string",
                                enum: ["BUY", "SELL"],
                                description: "Transaction type",
                            },
                            quantity: {
                                type: "number",
                                description: "Quantity",
                                default: "1",
                                minimum: 1,
                            },
                            product: {
                                type: "string",
                                enum: ["CNC", "NRML", "MIS", "MTF"],
                                description: "Product type",
                            },
                            order_type: {
                                type: "string",
                                enum: ["MARKET", "LIMIT", "SL", "SL-M"],
                                description: "Order type",
                            },
                            price: {
                                type: "number",
                                description: "Price (required for LIMIT order_type",
                            },
                            trigger_price: {
                                type: "number",
                                description:
                                    "The price at which an order should be triggered (SL, SL-M orders)",
                            },
                            validity: {
                                type: "string",
                                enum: ["DAY", "IOC", "TTL"],
                                description:
                                    "Order Validity. (DAY for regular orders, IOC for immediate or cancel, and TTL for orders valid for specific minutes",
                            },
                            disclosed_quantity: {
                                type: "number",
                                description: "Quantity to disclose publicly (for equity trades)",
                            },
                            tag: {
                                type: "string",
                                description:
                                    "An optional tag to apply to an order to identify it (alphanumeric, max 20 chars)",
                                maxLength: 20,
                            },
                            iceberg_legs: {
                                type: "number",
                                description: "Number of legs for iceberg orders",
                            },
                            iceberg_quantity: {
                                type: "number",
                                description: "Quantity per leg for iceberg orders",
                            },
                            validity_ttl: {
                                type: "number",
                                description:
                                    "Order life span in minutes for TTL validity orders, required for TTL orders",
                            },
                        },
                        required: [
                            "variety",
                            "exchange",
                            "tradingsymbol",
                            "transaction_type",
                            "quantity",
                            "product",
                            "order_type",
                        ],
                    },
                },
                {
                    name: "modify_order",
                    description: "Modify an existing order",
                    inputSchema: {
                        type: "object",
                        properties: {
                            variety: {
                                type: "string",
                                enum: ["regular", "co", "amo", "iceberg", "auction"],
                                default: "regular",
                                description: "Order variety",
                            },
                            order_id: {
                                type: "string",
                                description: "Order ID",
                            },
                            quantity: {
                                type: "number",
                                description: "Quantity",
                                default: "1",
                                minimum: 1,
                            },
                            order_type: {
                                type: "string",
                                enum: ["MARKET", "LIMIT", "SL", "SL-M"],
                                description: "Order type",
                            },
                            price: {
                                type: "number",
                                description: "Price (required for LIMIT order_type",
                            },
                            trigger_price: {
                                type: "number",
                                description:
                                    "The price at which an order should be triggered (SL, SL-M orders)",
                            },
                            validity: {
                                type: "string",
                                enum: ["DAY", "IOC", "TTL"],
                                description:
                                    "Order Validity. (DAY for regular orders, IOC for immediate or cancel, and TTL for orders valid for specific minutes",
                            },
                            disclosed_quantity: {
                                type: "number",
                                description: "Quantity to disclose publicly (for equity trades)",
                            },
                        },
                        required: ["variety", "order_id", "order_type"],
                    },
                },
                {
                    name: "cancel_order",
                    description: "Cancel an existing order",
                    inputSchema: {
                        type: "object",
                        properties: {
                            variety: {
                                type: "string",
                                enum: ["regular", "co", "amo", "iceberg", "auction"],
                                default: "regular",
                                description: "Order variety",
                            },
                            order_id: {
                                type: "string",
                                description: "Order ID",
                            },
                        },
                        required: ["variety", "order_id"],
                    },
                },
                {
                    name: "get_orders",
                    description: "Get all orders. Supports pagination for large datasets.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            limit: {
                                type: "number",
                                description:
                                    "Maximum number of orders to return. If not specified, returns all orders. When specified, response includes pagination metadata.",
                            },
                            from: {
                                type: "number",
                                description: "Starting index for pagination (0-based). Default: 0",
                            },
                        },
                    },
                },
                {
                    name: "get_order_history",
                    description: "Get order history for a specific order",
                    inputSchema: {
                        type: "object",
                        properties: {
                            order_id: {
                                type: "string",
                                description: "ID of the order to fetch history for",
                            },
                        },
                        required: ["order_id"],
                    },
                },
                {
                    name: "get_order_trades",
                    description: "Get trades for a specific order",
                    inputSchema: {
                        type: "object",
                        properties: {
                            order_id: {
                                type: "string",
                                description: "ID of the order to fetch trades for",
                            },
                        },
                        required: ["order_id"],
                    },
                },
                {
                    name: "get_trades",
                    description: "Get trading history. Supports pagination for large datasets.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            limit: {
                                type: "number",
                                description:
                                    "Maximum number of trades to return. If not specified, returns all trades. When specified, response includes pagination metadata.",
                            },
                            from: {
                                type: "number",
                                description: "Starting index for pagination (0-based). Default: 0",
                            },
                        },
                    },
                },
                {
                    name: "get_positions",
                    description: "Get current positions. Supports pagination for large datasets.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            client_id: {
                                type: "string",
                                description: "Account identifier (optional if only one account)",
                            },
                            limit: {
                                type: "number",
                                description:
                                    "Maximum number of positions to return. If not specified, returns all positions. When specified, response includes pagination metadata.",
                            },
                            from: {
                                type: "number",
                                description: "Starting index for pagination (0-based). Default: 0",
                            },
                        },
                    },
                },
                {
                    name: "get_holdings",
                    description: "Get holdings for the current user. Supports pagination for large datasets.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            client_id: {
                                type: "string",
                                description: "Account identifier (optional if only one account)",
                            },
                            limit: {
                                type: "number",
                                description:
                                    "Maximum number of holdings to return. If not specified, returns all holdings. When specified, response includes pagination metadata.",
                            },
                            from: {
                                type: "number",
                                description: "Starting index for pagination (0-based). Default: 0",
                            },
                        },
                    },
                },
                {
                    name: "get_mf_holdings",
                    description: "Get all mutual fund holdings. Supports pagination for large datasets.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            client_id: {
                                type: "string",
                                description: "Account identifier (optional if only one account)",
                            },
                            limit: {
                                type: "number",
                                description:
                                    "Maximum number of MF holdings to return. If not specified, returns all holdings. When specified, response includes pagination metadata.",
                            },
                            from: {
                                type: "number",
                                description: "Starting index for pagination (0-based). Default: 0",
                            },
                        },
                    },
                },
                {
                    name: "search_instruments",
                    description: "Search instruments. Supports pagination for large result sets.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            query: {
                                type: "string",
                                description: "Search query",
                            },
                            filter_on: {
                                type: "string",
                                enum: ["id", "name", "isin", "tradingsymbol", "underlying"],
                                description:
                                    "Filter on a specific field. (Optional). [id(default)=exch:tradingsymbol, name=nice name of the instrument, tradingsymbol=used to trade in a specific exchange, isin=universal identifier for an instrument across exchanges], underlying=[query=underlying instrument, result=futures and options. note=query format -> exch:tradingsymbol where NSE/BSE:PNB converted to -> NFO/BFO:PNB for query since futures and options available under them]",
                            },
                            limit: {
                                type: "number",
                                description:
                                    "Maximum number of instruments to return. If not specified, returns all matching instruments. When specified, response includes pagination metadata.",
                            },
                            from: {
                                type: "number",
                                description: "Starting index for pagination (0-based). Default: 0",
                            },
                        },
                        required: ["query"],
                    },
                },
                {
                    name: "get_quotes",
                    description: "Get market data quotes for a list of instruments",
                    inputSchema: {
                        type: "object",
                        properties: {
                            instruments: {
                                type: "array",
                                items: {
                                    type: "string",
                                },
                                description:
                                    "Eg. ['NSE:INFY', 'NSE:SBIN']. This API returns the complete market data snapshot of up to 500 instruments in one go. It includes the quantity, OHLC, and Open Interest fields, and the complete bid/ask market depth amongst others. Instruments are identified by the exchange:tradingsymbol combination and are passed as values to the query parameter i which is repeated for every instrument. If there is no data available for a given key, the key will be absent from the response.",
                            },
                        },
                        required: ["instruments"],
                    },
                },
                {
                    name: "get_ohlc",
                    description:
                        "Get OHLC (Open, High, Low, Close) data for a list of instruments",
                    inputSchema: {
                        type: "object",
                        properties: {
                            instruments: {
                                type: "array",
                                items: {
                                    type: "string",
                                },
                                description:
                                    "Eg. ['NSE:INFY', 'NSE:SBIN']. This API returns OHLC data for the given list of instruments in the format of exchange:tradingsymbol.",
                            },
                        },
                        required: ["instruments"],
                    },
                },
                {
                    name: "get_ltp",
                    description: "Get latest trading prices for a list of instruments",
                    inputSchema: {
                        type: "object",
                        properties: {
                            instruments: {
                                type: "array",
                                items: {
                                    type: "string",
                                },
                                description:
                                    "Eg. ['NSE:INFY', 'NSE:SBIN']. This API returns the lastest price for the given list of instruments in the format of exchange:tradingsymbol.",
                            },
                        },
                        required: ["instruments"],
                    },
                },
                {
                    name: "get_historical_data",
                    description: "Get historical price data for an instrument",
                    inputSchema: {
                        type: "object",
                        properties: {
                            instrument_token: {
                                type: "number",
                                description:
                                    "Instrument token (can be obtained from search_instruments tool)",
                            },
                            from_date: {
                                type: "string",
                                description: "From date in YYYY-MM-DD HH:MM:SS format",
                            },
                            to_date: {
                                type: "string",
                                description: "To date in YYYY-MM-DD HH:MM:SS format",
                            },
                            interval: {
                                type: "string",
                                enum: [
                                    "minute",
                                    "day",
                                    "3minute",
                                    "5minute",
                                    "10minute",
                                    "15minute",
                                    "30minute",
                                    "60minute",
                                ],
                                description: "Candle interval",
                            },
                            continuous: {
                                type: "boolean",
                                default: false,
                                description: "Get continuous data (for futures and options)",
                            },
                            oi: {
                                type: "boolean",
                                default: false,
                                description: "Include open interest data",
                            },
                        },
                        required: ["instrument_token", "from_date", "to_date", "interval"],
                    },
                },
                {
                    name: "place_gtt_order",
                    description: "Place a GTT (Good Till Triggered) order",
                    inputSchema: {
                        type: "object",
                        properties: {
                            trigger_type: {
                                type: "string",
                                enum: ["single", "two-leg"],
                                description: "GTT trigger type",
                            },
                            exchange: {
                                type: "string",
                                enum: ["NSE", "BSE", "MCX", "NFO", "BFO"],
                                default: "NSE",
                                description: "The exchange to which the order should be placed",
                            },
                            tradingsymbol: {
                                type: "string",
                                description: "Trading symbol",
                            },
                            last_price: {
                                type: "number",
                                description: "Last price of the instrument",
                            },
                            transaction_type: {
                                type: "string",
                                enum: ["BUY", "SELL"],
                                description: "Transaction type",
                            },
                            product: {
                                type: "string",
                                enum: ["CNC", "NRML", "MIS", "MTF"],
                                description: "Product type",
                            },
                            trigger_value: {
                                type: "number",
                                description:
                                    "Price point at which the GTT will be triggered (for single-leg)",
                            },
                            quantity: {
                                type: "number",
                                description: "Quantity for the order (for single-leg)",
                            },
                            limit_price: {
                                type: "number",
                                description: "Limit price for the order (for single-leg)",
                            },
                            upper_trigger_value: {
                                type: "number",
                                description:
                                    "Upper price point at which the GTT will be triggered (for two-leg)",
                            },
                            upper_quantity: {
                                type: "number",
                                description: "Quantity for the upper trigger order (for two-leg)",
                            },
                            upper_limit_price: {
                                type: "number",
                                description: "Limit price for the upper trigger order (for two-leg)",
                            },
                            lower_trigger_value: {
                                type: "number",
                                description:
                                    "Lower price point at which the GTT will be triggered (for two-leg)",
                            },
                            lower_quantity: {
                                type: "number",
                                description: "Quantity for the lower trigger order (for two-leg)",
                            },
                            lower_limit_price: {
                                type: "number",
                                description: "Limit price for the lower trigger order (for two-leg)",
                            },
                        },
                        required: [
                            "exchange",
                            "tradingsymbol",
                            "last_price",
                            "transaction_type",
                            "product",
                            "trigger_type",
                        ],
                    },
                },
                {
                    name: "modify_gtt_order",
                    description: "Modify an existing GTT (Good Till Triggered) order",
                    inputSchema: {
                        type: "object",
                        properties: {
                            trigger_id: {
                                type: "number",
                                description: "The ID of the GTT order to modify",
                            },
                            trigger_type: {
                                type: "string",
                                enum: ["single", "two-leg"],
                                description: "GTT trigger type",
                            },
                            exchange: {
                                type: "string",
                                enum: ["NSE", "BSE", "MCX", "NFO", "BFO"],
                                default: "NSE",
                                description: "The exchange to which the order should be placed",
                            },
                            tradingsymbol: {
                                type: "string",
                                description: "Trading symbol",
                            },
                            last_price: {
                                type: "number",
                                description: "Last price of the instrument",
                            },
                            transaction_type: {
                                type: "string",
                                enum: ["BUY", "SELL"],
                                description: "Transaction type",
                            },
                            trigger_value: {
                                type: "number",
                                description:
                                    "Price point at which the GTT will be triggered (for single-leg)",
                            },
                            quantity: {
                                type: "number",
                                description: "Quantity for the order (for single-leg)",
                            },
                            limit_price: {
                                type: "number",
                                description: "Limit price for the order (for single-leg)",
                            },
                            upper_trigger_value: {
                                type: "number",
                                description:
                                    "Upper price point at which the GTT will be triggered (for two-leg)",
                            },
                            upper_quantity: {
                                type: "number",
                                description: "Quantity for the upper trigger order (for two-leg)",
                            },
                            upper_limit_price: {
                                type: "number",
                                description: "Limit price for the upper trigger order (for two-leg)",
                            },
                            lower_trigger_value: {
                                type: "number",
                                description:
                                    "Lower price point at which the GTT will be triggered (for two-leg)",
                            },
                            lower_quantity: {
                                type: "number",
                                description: "Quantity for the lower trigger order (for two-leg)",
                            },
                            lower_limit_price: {
                                type: "number",
                                description: "Limit price for the lower trigger order (for two-leg)",
                            },
                        },
                        required: [
                            "trigger_id",
                            "exchange",
                            "tradingsymbol",
                            "last_price",
                            "transaction_type",
                            "trigger_type",
                        ],
                    },
                },
                {
                    name: "delete_gtt_order",
                    description: "Delete an existing GTT (Good Till Triggered) order",
                    inputSchema: {
                        type: "object",
                        properties: {
                            trigger_id: {
                                type: "number",
                                description: "The ID of the GTT order to delete",
                            },
                        },
                        required: ["trigger_id"],
                    },
                },
                {
                    name: "get_gtts",
                    description: "Get all active GTT orders. Supports pagination for large datasets.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            limit: {
                                type: "number",
                                description:
                                    "Maximum number of GTT orders to return. If not specified, returns all GTT orders. When specified, response includes pagination metadata.",
                            },
                            from: {
                                type: "number",
                                description: "Starting index for pagination (0-based). Default: 0",
                            },
                        },
                    },
                },
            ];

            return { tools };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                const { name, arguments: args } = request.params;

                switch (name) {
                    case "list_accounts":
                        return await this.handleListAccounts();
                    case "login":
                        return await this.handleLogin(args as any);
                    case "generate_session":
                        return await this.handleGenerateSession(args as any);
                    case "get_profile":
                        return await this.handleGetProfile();
                    case "get_margins":
                        return await this.handleGetMargins();
                    case "place_order":
                        return await this.handlePlaceOrder(args as any);
                    case "modify_order":
                        return await this.handleModifyOrder(args as any);
                    case "cancel_order":
                        return await this.handleCancelOrder(args as any);
                    case "get_orders":
                        return await this.handleGetOrders(args as any);
                    case "get_order_history":
                        return await this.handleGetOrderHistory(args as any);
                    case "get_order_trades":
                        return await this.handleGetOrderTrades(args as any);
                    case "get_trades":
                        return await this.handleGetTrades(args as any);
                    case "get_positions":
                        return await this.handleGetPositions(args as any);
                    case "get_holdings":
                        return await this.handleGetHoldings(args as any);
                    case "get_mf_holdings":
                        return await this.handleGetMFHoldings(args as any);
                    case "search_instruments":
                        return await this.handleSearchInstruments(args as any);
                    case "get_quotes":
                        return await this.handleGetQuotes(args as any);
                    case "get_ohlc":
                        return await this.handleGetOHLC(args as any);
                    case "get_ltp":
                        return await this.handleGetLTP(args as any);
                    case "get_historical_data":
                        return await this.handleGetHistoricalData(args as any);
                    case "place_gtt_order":
                        return await this.handlePlaceGTTOrder(args as any);
                    case "modify_gtt_order":
                        return await this.handleModifyGTTOrder(args as any);
                    case "delete_gtt_order":
                        return await this.handleDeleteGTTOrder(args as any);
                    case "get_gtts":
                        return await this.handleGetGTTs(args as any);
                    default:
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `Unknown tool: ${name}`,
                                },
                            ],
                            isError: true,
                        };
                }
            } catch (error: any) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error.message}\n${error.stack}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }

    private getSession(clientId?: string): KiteSession {
        // If no clientId provided, try to use single account or throw error
        if (!clientId) {
            if (this.sessions.size === 1) {
                // Convenience: if only one account, use it
                return Array.from(this.sessions.values())[0];
            } else if (this.sessions.size === 0) {
                throw new Error(
                    "Not authenticated. Please call the 'login' tool first with client_id."
                );
            } else {
                const availableIds = Array.from(this.sessions.keys()).join(', ');
                throw new Error(
                    `Multiple accounts available (${availableIds}). Please specify 'client_id' parameter.`
                );
            }
        }

        const session = this.sessions.get(clientId);
        if (!session || !session.credentials.access_token) {
            throw new Error(
                `Not authenticated for client_id '${clientId}'. Please login first.`
            );
        }

        return session;
    }

    private ensureAuthenticated(clientId?: string) {
        this.getSession(clientId); // Will throw if not authenticated
    }

    private async handleListAccounts() {
        const accounts = getAccountsList();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ accounts }, null, 2),
                },
            ],
        };
    }

    private async handleLogin(args: { client_id: string; api_key?: string; api_secret?: string }) {
        const { client_id, api_key, api_secret } = args;

        // Try to get config from env first
        const config = getAccountConfig(client_id);

        const finalApiKey = api_key || config?.apiKey;
        const finalApiSecret = api_secret || config?.apiSecret;

        if (!finalApiKey || !finalApiSecret) {
            throw new Error(
                `Cannot find API credentials for client_id '${client_id}'. Either provide api_key and api_secret, or configure them in environment variables.`
            );
        }

        const credentials: KiteCredentials = {
            api_key: finalApiKey,
            api_secret: finalApiSecret,
        };

        const kc = new KiteConnect({ api_key: finalApiKey });
        const loginUrl = kc.getLoginURL();

        this.sessions.set(client_id, { kc, credentials });
        await this.saveCredentials();

        return {
            content: [
                {
                    type: "text",
                    text: `Please click the following link to authorize account '${client_id}':\n\n[Login to Kite Connect](${loginUrl})\n\nAfter authorization, you will be redirected to a URL containing a 'request_token' parameter. Copy that token and call the 'generate_session' tool with client_id='${client_id}' and the request_token.`,
                },
            ],
        };
    }

    private async handleGenerateSession(args: { client_id: string; request_token: string }) {
        const { client_id, request_token } = args;

        const session = this.sessions.get(client_id);
        if (!session || !session.credentials.api_secret) {
            throw new Error(`Please call 'login' first for client_id '${client_id}'.`);
        }

        const response = await session.kc.generateSession(
            request_token,
            session.credentials.api_secret
        );

        session.credentials.access_token = response.access_token;
        session.credentials.request_token = request_token;
        session.kc.setAccessToken(response.access_token);

        await this.saveCredentials();

        return {
            content: [
                {
                    type: "text",
                    text: `Session generated successfully for '${client_id}'!\n\nAccess Token: ${response.access_token}\nUser ID: ${response.user_id}\nLogin Time: ${response.login_time}\n\nYou are now authenticated and can use all other tools for this account.`,
                },
            ],
        };
    }

    private async handleGetProfile(args?: { client_id?: string }) {
        const session = this.getSession(args?.client_id);
        const profile = await session.kc.getProfile();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(profile, null, 2),
                },
            ],
        };
    }

    private async handleGetMargins(args?: { client_id?: string }) {
        const session = this.getSession(args?.client_id);
        const margins = await session.kc.getMargins();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(margins, null, 2),
                },
            ],
        };
    }

    private async handlePlaceOrder(args: any) {
        const session = this.getSession(args?.client_id);
        const response = await session.kc.placeOrder(args.variety, args);
        return {
            content: [
                {
                    type: "text",
                    text: `Order placed successfully!\n\n${JSON.stringify(response, null, 2)}`,
                },
            ],
        };
    }

    private async handleModifyOrder(args: any) {
        const session = this.getSession(args?.client_id);
        const response = await session.kc.modifyOrder(args.variety, args.order_id, args);
        return {
            content: [
                {
                    type: "text",
                    text: `Order modified successfully!\n\n${JSON.stringify(response, null, 2)}`,
                },
            ],
        };
    }

    private async handleCancelOrder(args: any) {
        const session = this.getSession(args?.client_id);
        const response = await session.kc.cancelOrder(args.variety, args.order_id);
        return {
            content: [
                {
                    type: "text",
                    text: `Order cancelled successfully!\n\n${JSON.stringify(response, null, 2)}`,
                },
            ],
        };
    }

    private async handleGetOrders(args: any) {
        const session = this.getSession(args?.client_id);
        let orders = await session.kc.getOrders();

        if (args.limit || args.from) {
            const from = args.from || 0;
            const limit = args.limit || orders.length;
            const paginatedOrders = orders.slice(from, from + limit);

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            orders: paginatedOrders,
                            pagination: {
                                total: orders.length,
                                from,
                                limit,
                                returned: paginatedOrders.length,
                            },
                        }, null, 2),
                    },
                ],
            };
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(orders, null, 2),
                },
            ],
        };
    }

    private async handleGetOrderHistory(args: { order_id: string; client_id?: string }) {
        const session = this.getSession(args?.client_id);
        const history = await session.kc.getOrderHistory(args.order_id);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(history, null, 2),
                },
            ],
        };
    }

    private async handleGetOrderTrades(args: { order_id: string; client_id?: string }) {
        const session = this.getSession(args?.client_id);
        const trades = await session.kc.getOrderTrades(args.order_id);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(trades, null, 2),
                },
            ],
        };
    }

    private async handleGetTrades(args: any) {
        const session = this.getSession(args?.client_id);
        let trades = await session.kc.getTrades();

        if (args.limit || args.from) {
            const from = args.from || 0;
            const limit = args.limit || trades.length;
            const paginatedTrades = trades.slice(from, from + limit);

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            trades: paginatedTrades,
                            pagination: {
                                total: trades.length,
                                from,
                                limit,
                                returned: paginatedTrades.length,
                            },
                        }, null, 2),
                    },
                ],
            };
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(trades, null, 2),
                },
            ],
        };
    }

    private async handleGetPositions(args: any) {
        const session = this.getSession(args?.client_id);
        let positions = await session.kc.getPositions();

        if (args.limit || args.from) {
            const from = args.from || 0;
            const limit = args.limit;

            const result: any = { ...positions };

            if (positions.net) {
                result.net = positions.net.slice(from, limit ? from + limit : undefined);
            }
            if (positions.day) {
                result.day = positions.day.slice(from, limit ? from + limit : undefined);
            }

            result.pagination = {
                total_net: positions.net?.length || 0,
                total_day: positions.day?.length || 0,
                from,
                limit: limit || "all",
            };

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(positions, null, 2),
                },
            ],
        };
    }

    private async handleGetHoldings(args: any) {
        const session = this.getSession(args?.client_id);
        let holdings = await session.kc.getHoldings();

        if (args.limit || args.from) {
            const from = args.from || 0;
            const limit = args.limit || holdings.length;
            const paginatedHoldings = holdings.slice(from, from + limit);

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            holdings: paginatedHoldings,
                            pagination: {
                                total: holdings.length,
                                from,
                                limit,
                                returned: paginatedHoldings.length,
                            },
                        }, null, 2),
                    },
                ],
            };
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(holdings, null, 2),
                },
            ],
        };
    }

    private async handleGetMFHoldings(args: any) {
        const session = this.getSession(args?.client_id);
        let holdings = await session.kc.getMFHoldings();

        if (args.limit || args.from) {
            const from = args.from || 0;
            const limit = args.limit || holdings.length;
            const paginatedHoldings = holdings.slice(from, from + limit);

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            mf_holdings: paginatedHoldings,
                            pagination: {
                                total: holdings.length,
                                from,
                                limit,
                                returned: paginatedHoldings.length,
                            },
                        }, null, 2),
                    },
                ],
            };
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(holdings, null, 2),
                },
            ],
        };
    }

    private async handleSearchInstruments(args: any) {
        const session = this.getSession(args?.client_id);
        let instruments = await session.kc.getInstruments(args.query, args.filter_on);

        if (args.limit || args.from) {
            const from = args.from || 0;
            const limit = args.limit || instruments.length;
            const paginatedInstruments = instruments.slice(from, from + limit);

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            instruments: paginatedInstruments,
                            pagination: {
                                total: instruments.length,
                                from,
                                limit,
                                returned: paginatedInstruments.length,
                            },
                        }, null, 2),
                    },
                ],
            };
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(instruments, null, 2),
                },
            ],
        };
    }

    private async handleGetQuotes(args: { instruments: string[]; client_id?: string }) {
        const session = this.getSession(args?.client_id);
        const quotes = await session.kc.getQuote(args.instruments);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(quotes, null, 2),
                },
            ],
        };
    }

    private async handleGetOHLC(args: { instruments: string[]; client_id?: string }) {
        const session = this.getSession(args?.client_id);
        const ohlc = await session.kc.getOHLC(args.instruments);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(ohlc, null, 2),
                },
            ],
        };
    }

    private async handleGetLTP(args: { instruments: string[]; client_id?: string }) {
        const session = this.getSession(args?.client_id);
        const ltp = await session.kc.getLTP(args.instruments);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(ltp, null, 2),
                },
            ],
        };
    }

    private async handleGetHistoricalData(args: any) {
        const session = this.getSession(args?.client_id);
        const data = await session.kc.getHistoricalData(
            args.instrument_token,
            args.interval,
            args.from_date,
            args.to_date,
            args.continuous,
            args.oi
        );
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }

    private async handlePlaceGTTOrder(args: any) {
        const session = this.getSession(args?.client_id);

        const gttParams: any = {
            trigger_type: args.trigger_type,
            tradingsymbol: args.tradingsymbol,
            exchange: args.exchange,
            trigger_values: args.trigger_type === "single"
                ? [args.trigger_value]
                : [args.lower_trigger_value, args.upper_trigger_value],
            last_price: args.last_price,
            orders: [],
        };

        if (args.trigger_type === "single") {
            gttParams.orders.push({
                transaction_type: args.transaction_type,
                quantity: args.quantity,
                product: args.product,
                order_type: args.limit_price ? "LIMIT" : "MARKET",
                price: args.limit_price || 0,
            });
        } else {
            // Two-leg order
            gttParams.orders.push(
                {
                    transaction_type: args.transaction_type,
                    quantity: args.lower_quantity,
                    product: args.product,
                    order_type: args.lower_limit_price ? "LIMIT" : "MARKET",
                    price: args.lower_limit_price || 0,
                },
                {
                    transaction_type: args.transaction_type,
                    quantity: args.upper_quantity,
                    product: args.product,
                    order_type: args.upper_limit_price ? "LIMIT" : "MARKET",
                    price: args.upper_limit_price || 0,
                }
            );
        }

        const response = await session.kc.placeGTT(gttParams);
        return {
            content: [
                {
                    type: "text",
                    text: `GTT order placed successfully!\n\n${JSON.stringify(response, null, 2)}`,
                },
            ],
        };
    }

    private async handleModifyGTTOrder(args: any) {
        const session = this.getSession(args?.client_id);

        const gttParams: any = {
            trigger_type: args.trigger_type,
            tradingsymbol: args.tradingsymbol,
            exchange: args.exchange,
            trigger_values: args.trigger_type === "single"
                ? [args.trigger_value]
                : [args.lower_trigger_value, args.upper_trigger_value],
            last_price: args.last_price,
            orders: [],
        };

        if (args.trigger_type === "single") {
            gttParams.orders.push({
                transaction_type: args.transaction_type,
                quantity: args.quantity,
                product: args.product,
                order_type: args.limit_price ? "LIMIT" : "MARKET",
                price: args.limit_price || 0,
            });
        } else {
            gttParams.orders.push(
                {
                    transaction_type: args.transaction_type,
                    quantity: args.lower_quantity,
                    product: args.product,
                    order_type: args.lower_limit_price ? "LIMIT" : "MARKET",
                    price: args.lower_limit_price || 0,
                },
                {
                    transaction_type: args.transaction_type,
                    quantity: args.upper_quantity,
                    product: args.product,
                    order_type: args.upper_limit_price ? "LIMIT" : "MARKET",
                    price: args.upper_limit_price || 0,
                }
            );
        }

        const response = await session.kc.modifyGTT(args.trigger_id, gttParams);
        return {
            content: [
                {
                    type: "text",
                    text: `GTT order modified successfully!\n\n${JSON.stringify(response, null, 2)}`,
                },
            ],
        };
    }

    private async handleDeleteGTTOrder(args: { trigger_id: number; client_id?: string }) {
        const session = this.getSession(args?.client_id);
        const response = await session.kc.deleteGTT(args.trigger_id);
        return {
            content: [
                {
                    type: "text",
                    text: `GTT order deleted successfully!\n\n${JSON.stringify(response, null, 2)}`,
                },
            ],
        };
    }

    private async handleGetGTTs(args: any) {
        const session = this.getSession(args?.client_id);
        let gtts = await session.kc.getGTTs();

        if (args.limit || args.from) {
            const from = args.from || 0;
            const limit = args.limit || gtts.length;
            const paginatedGTTs = gtts.slice(from, from + limit);

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            gtts: paginatedGTTs,
                            pagination: {
                                total: gtts.length,
                                from,
                                limit,
                                returned: paginatedGTTs.length,
                            },
                        }, null, 2),
                    },
                ],
            };
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(gtts, null, 2),
                },
            ],
        };
    }

    public async callTool(name: string, args: any): Promise<any> {
        switch (name) {
            case "list_accounts":
                return await this.handleListAccounts();
            case "login":
                return await this.handleLogin(args);
            case "generate_session":
                return await this.handleGenerateSession(args);
            case "get_profile":
                return await this.handleGetProfile(args);
            case "get_margins":
                return await this.handleGetMargins(args);
            case "place_order":
                return await this.handlePlaceOrder(args);
            case "modify_order":
                return await this.handleModifyOrder(args);
            case "cancel_order":
                return await this.handleCancelOrder(args);
            case "get_orders":
                return await this.handleGetOrders(args);
            case "get_order_history":
                return await this.handleGetOrderHistory(args);
            case "get_order_trades":
                return await this.handleGetOrderTrades(args);
            case "get_trades":
                return await this.handleGetTrades(args);
            case "get_positions":
                return await this.handleGetPositions(args);
            case "get_holdings":
                return await this.handleGetHoldings(args);
            case "get_mf_holdings":
                return await this.handleGetMFHoldings(args);
            case "search_instruments":
                return await this.handleSearchInstruments(args);
            case "get_quotes":
                return await this.handleGetQuotes(args);
            case "get_ohlc":
                return await this.handleGetOHLC(args);
            case "get_ltp":
                return await this.handleGetLTP(args);
            case "get_historical_data":
                return await this.handleGetHistoricalData(args);
            case "place_gtt_order":
                return await this.handlePlaceGTTOrder(args);
            case "modify_gtt_order":
                return await this.handleModifyGTTOrder(args);
            case "delete_gtt_order":
                return await this.handleDeleteGTTOrder(args);
            case "get_gtts":
                return await this.handleGetGTTs(args);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("Kite MCP Server running on stdio");
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const server = new KiteMCPServer();
    server.run().catch(console.error);
}


