# Kite MCP Server

A Model Context Protocol (MCP) server for the [Zerodha Kite Connect](https://kite.trade) trading APIs. This server enables AI assistants to interact with Kite Connect to execute trades, manage portfolios, fetch market data, and more.

**🚀 [Quick Start Guide](QUICKSTART.md)** | **📖 [Usage Examples](USAGE_EXAMPLES.md)** | **🔗 [Kite Connect Docs](https://kite.trade/docs/connect/v3/)**

## Features

- 🔐 **Authentication**: Secure login flow with API key and access token management
- 📊 **Market Data**: Real-time quotes, OHLC, LTP, and historical data
- 📈 **Trading**: Place, modify, and cancel orders (Regular, AMO, CO, Iceberg, Auction)
- 💼 **Portfolio**: View holdings, positions, and mutual fund holdings
- 🎯 **GTT Orders**: Place and manage Good Till Triggered orders
- 🔍 **Instrument Search**: Search and filter trading instruments
- 📉 **Order Management**: Track order history and trades

## Installation

### Prerequisites

- Node.js v18.0.0 or higher
- A Zerodha Kite Connect account with API access
- API Key and API Secret from [Kite Connect Developer Console](https://developers.kite.trade/)

### Setup

1. Clone this repository:

```bash
git clone <repository-url>
cd kite-mcp
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

4. Test the installation:

```bash
npm test
```

You should see: "✅ SUCCESS! MCP Server started correctly."

## Configuration

### For Claude Desktop

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "kite": {
      "command": "node",
      "args": ["/absolute/path/to/kite-mcp/dist/index.js"]
    }
  }
}
```

### For Other MCP Clients

Configure your MCP client to run:

```bash
node /path/to/kite-mcp/dist/index.js
```

## Usage

### 1. Authentication

First, authenticate with Kite Connect:

```
Use the login tool with your API key and API secret
```

The server will return a login URL. Click on it to authorize the application. After authorization, you'll be redirected to a URL containing a `request_token` parameter.

```
Use the generate_session tool with the request_token
```

This will complete the authentication process and store your access token locally in `~/.kite-mcp-credentials.json`.

### 2. Available Tools

Once authenticated, you can use any of the following tools:

#### Profile & Account

- **get_profile**: Get user profile information
- **get_margins**: Get account margin details

#### Trading

- **place_order**: Place a new order
- **modify_order**: Modify an existing order
- **cancel_order**: Cancel an order
- **get_orders**: Get all orders
- **get_order_history**: Get order history for a specific order
- **get_order_trades**: Get trades for a specific order

#### Portfolio

- **get_positions**: Get current positions
- **get_holdings**: Get holdings
- **get_mf_holdings**: Get mutual fund holdings
- **get_trades**: Get trade history

#### Market Data

- **search_instruments**: Search for trading instruments
- **get_quotes**: Get detailed quotes for instruments
- **get_ohlc**: Get OHLC data
- **get_ltp**: Get last traded price
- **get_historical_data**: Get historical candle data

#### GTT Orders

- **place_gtt_order**: Place a GTT order
- **modify_gtt_order**: Modify a GTT order
- **delete_gtt_order**: Delete a GTT order
- **get_gtts**: Get all active GTT orders

## Example Conversations

### Example 1: Check Profile and Margins

```
User: What's my profile information?
Assistant: [Uses get_profile tool]

User: How much margin do I have?
Assistant: [Uses get_margins tool]
```

### Example 2: Place a Market Order

```
User: Buy 10 shares of INFY at market price
Assistant: [Uses place_order tool with parameters:
  - variety: "regular"
  - exchange: "NSE"
  - tradingsymbol: "INFY"
  - transaction_type: "BUY"
  - quantity: 10
  - product: "CNC"
  - order_type: "MARKET"
]
```

### Example 3: Get Market Data

```
User: What's the current price of Reliance?
Assistant: [Uses search_instruments to find the instrument, then get_ltp]

User: Show me the OHLC data for TCS
Assistant: [Uses get_ohlc tool with instruments: ["NSE:TCS"]]
```

### Example 4: View Positions

```
User: What positions do I have open?
Assistant: [Uses get_positions tool]

User: Show me my holdings
Assistant: [Uses get_holdings tool]
```

## Security

- **Credentials Storage**: API keys and access tokens are stored locally in `~/.kite-mcp-credentials.json`
- **Never commit credentials**: The `.gitignore` file is configured to exclude credentials
- **API Security**: Follow Zerodha's security best practices for API usage

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Project Structure

```
kite-mcp/
├── src/
│   └── index.ts          # Main MCP server implementation
├── dist/                 # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## API Reference

This server wraps the official [kiteconnectjs](https://github.com/zerodha/kiteconnectjs) library. For detailed API documentation, refer to:

- [Kite Connect API Documentation](https://kite.trade/docs/connect/v3/)
- [kiteconnectjs TypeScript Documentation](https://kite.trade/docs/kiteconnectjs/v5/)

## Troubleshooting

### "Not authenticated" Error

If you see this error, you need to authenticate:

1. Call the `login` tool with your API key and secret
2. Follow the login URL
3. Call `generate_session` with the request token

### Session Expired

Kite Connect access tokens are valid for the entire trading day. If your session expires:

1. Get a new request token by visiting the login URL
2. Call `generate_session` with the new request token

### API Rate Limits

Kite Connect has rate limits:
- 3 requests per second
- Some endpoints have specific limits

The server does not implement rate limiting, so be mindful of your request frequency.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Disclaimer

This is an unofficial MCP server for Kite Connect. Use at your own risk. Always test with small amounts and paper trading before using real money. The authors are not responsible for any trading losses.

## Support

For Kite Connect API issues, contact [Zerodha Support](https://support.zerodha.com/)

For MCP server issues, please open an issue on this repository.

