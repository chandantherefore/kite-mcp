# Quick Start Guide

Get up and running with Kite MCP Server in 5 minutes!

## Prerequisites

Before you begin, ensure you have:

1. ✅ Node.js v18+ installed
2. ✅ A Zerodha Kite Connect account
3. ✅ API credentials from [Kite Connect Developer Console](https://developers.kite.trade/)
4. ✅ Claude Desktop or another MCP-compatible client

## Installation Steps

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd kite-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### 2. Configure Claude Desktop

**On macOS:**

```bash
# Edit the config file
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**On Windows:**

```bash
# Edit the config file
notepad %APPDATA%\Claude\claude_desktop_config.json
```

**Add this configuration:**

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

⚠️ **Important**: Replace `/absolute/path/to/kite-mcp` with your actual path!

### 3. Restart Claude Desktop

Close and reopen Claude Desktop to load the MCP server.

### 4. Verify Installation

In Claude Desktop, check if the Kite MCP server appears in the MCP servers list (usually shown with a 🔌 icon).

## First Use - Authentication

### Step 1: Login

In Claude, say:

```
I want to connect to my Kite account.
My API key is: your_api_key_here
My API secret is: your_api_secret_here
```

Claude will use the `login` tool and provide you with an authorization URL.

### Step 2: Authorize

1. Click the authorization URL
2. Log in to your Zerodha account
3. Grant permissions
4. You'll be redirected to a URL with a `request_token` parameter

**Example redirect URL:**
```
https://127.0.0.1/?request_token=abc123xyz456&action=login&status=success
```

Copy the `request_token` value (e.g., `abc123xyz456`)

### Step 3: Complete Authentication

In Claude, say:

```
Here's my request token: abc123xyz456
```

Claude will use the `generate_session` tool to complete authentication.

**You're now authenticated! 🎉**

## Quick Examples

### Check Your Profile

```
What's my trading profile?
```

### View Available Margin

```
How much margin do I have available?
```

### Get Current Price

```
What's the current price of Infosys?
```

### Place a Market Order (⚠️ This will execute a real trade!)

```
Buy 1 share of INFY at market price
```

### View Your Positions

```
Show me my current positions
```

### View Your Holdings

```
What stocks do I own?
```

### Search for Instruments

```
Find all instruments for Reliance Industries
```

### Get Detailed Quote

```
Show me detailed market data for TCS
```

### Set a GTT Order

```
Set a GTT to sell 50 shares of INFY when it reaches 1500
```

## Understanding Product Types

When placing orders, you'll use these product types:

- **CNC**: Cash and Carry (for delivery trading)
- **MIS**: Margin Intraday Square-off (for intraday trading)
- **NRML**: Normal (for futures and options)
- **MTF**: Margin Trading Facility

## Understanding Order Types

- **MARKET**: Execute at current market price
- **LIMIT**: Execute at specified price or better
- **SL**: Stop-Loss Limit order
- **SL-M**: Stop-Loss Market order

## Common Workflows

### 1. Research Before Trading

```markdown
1. "Search for instruments matching HDFC"
2. "What's the current price of NSE:HDFCBANK?"
3. "Show me OHLC data for HDFC Bank"
4. "Get historical data for the last month"
```

### 2. Execute a Trade

```markdown
1. "How much margin do I have?"
2. "Buy 10 shares of HDFCBANK at market price"
3. "What's the status of my last order?"
```

### 3. Monitor Portfolio

```markdown
1. "Show me my current positions"
2. "What's my total P&L today?"
3. "Show me my holdings"
```

### 4. Risk Management

```markdown
1. "Set a stop-loss at 1500 for my INFY position"
2. "Set a GTT with target at 650 and stop-loss at 620"
```

## Troubleshooting

### MCP Server Not Showing in Claude

1. Verify the path in `claude_desktop_config.json` is absolute
2. Ensure the file has execute permissions: `chmod +x dist/index.js`
3. Restart Claude Desktop completely
4. Check Claude Desktop logs for errors

### "Not authenticated" Error

You need to complete the authentication flow:
1. Use the `login` tool
2. Visit the authorization URL
3. Use `generate_session` with the request token

### Session Expired

Kite Connect sessions are valid for the trading day. To refresh:
1. Get a new request token by visiting the login URL
2. Use `generate_session` with the new token

### Invalid Trading Symbol

Use the `search_instruments` tool to find the correct symbol format (e.g., "NSE:INFY")

### Order Rejected

Common reasons:
- Insufficient margin
- Invalid price/quantity
- Market closed
- Incorrect product type for instrument

Check the error message and verify your order parameters.

## Safety Tips

⚠️ **Before Trading with Real Money:**

1. ✅ Understand all order parameters
2. ✅ Start with small quantities
3. ✅ Use limit orders instead of market orders when possible
4. ✅ Always set stop-losses
5. ✅ Double-check order details before confirming
6. ✅ Test with paper trading first if possible

## Next Steps

- Read the [full documentation](README.md)
- Explore [detailed usage examples](USAGE_EXAMPLES.md)
- Learn about [Kite Connect API](https://kite.trade/docs/connect/v3/)

## Getting Help

- **Kite Connect Issues**: [Zerodha Support](https://support.zerodha.com/)
- **MCP Server Issues**: Open an issue on GitHub
- **API Documentation**: [Kite Connect Docs](https://kite.trade/docs/connect/v3/)

## Important Disclaimers

⚠️ **Risk Warning:**

- Trading involves risk and may not be suitable for all investors
- Past performance is not indicative of future results
- Only trade with money you can afford to lose
- This is an unofficial tool - use at your own risk
- Always verify trades through official Kite platform

⚠️ **Technical Disclaimer:**

- This MCP server is provided "as-is" without warranties
- The authors are not responsible for any trading losses
- Always test thoroughly in a safe environment first

---

**Ready to trade?** Start with the authentication steps above! 🚀

