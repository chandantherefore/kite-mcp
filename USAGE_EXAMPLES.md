# Kite MCP Server - Usage Examples

This document provides comprehensive examples of how to interact with the Kite MCP server through an AI assistant like Claude.

## Table of Contents

- [Authentication](#authentication)
- [Account Information](#account-information)
- [Market Data](#market-data)
- [Trading Operations](#trading-operations)
- [Portfolio Management](#portfolio-management)
- [GTT Orders](#gtt-orders)
- [Advanced Examples](#advanced-examples)

## Authentication

### Initial Login

**User**: "I want to connect to my Kite account. My API key is xxx and API secret is yyy"

**Assistant**: Will use the `login` tool and provide you with an authorization URL.

**User**: "I've authorized and got this request token: zzz"

**Assistant**: Will use `generate_session` tool to complete authentication.

## Account Information

### Get Profile

**User**: "What's my trading profile?"

**Assistant**: Uses `get_profile` to show:
- User ID
- Name and email
- Account products available
- Exchanges enabled
- Order types allowed

### Check Margins

**User**: "How much trading margin do I have?"

**Assistant**: Uses `get_margins` to show:
- Available cash
- Used margin
- Available margin
- Separate equity and commodity margins

**User**: "Do I have enough margin to buy 100 shares of TCS?"

**Assistant**: Will check your margins and calculate if you have sufficient funds.

## Market Data

### Search for Instruments

**User**: "Find all instruments for Reliance Industries"

**Assistant**: Uses `search_instruments` with query "Reliance" to show:
- NSE equity
- BSE equity
- Futures contracts
- Options contracts

**User**: "Search for banking sector ETFs"

**Assistant**: Uses `search_instruments` with query "bank" and filters results.

### Get Current Prices

**User**: "What's the current price of INFY?"

**Assistant**: 
1. Uses `search_instruments` to find "NSE:INFY"
2. Uses `get_ltp` to show current price

**User**: "Show me prices for INFY, TCS, and WIPRO"

**Assistant**: Uses `get_ltp` with instruments: ["NSE:INFY", "NSE:TCS", "NSE:WIPRO"]

### Get Detailed Quotes

**User**: "Give me detailed market data for Nifty 50"

**Assistant**: Uses `get_quotes` to show:
- Last price
- Open, high, low, close
- Volume
- Bid/ask prices
- Market depth
- Open interest (for derivatives)

### Get OHLC Data

**User**: "What's today's OHLC for State Bank of India?"

**Assistant**: Uses `get_ohlc` for "NSE:SBIN" to show:
- Open
- High
- Low
- Close (last traded price)

### Get Historical Data

**User**: "Show me 1-day candles for HDFC Bank for the last month"

**Assistant**: Uses `get_historical_data` with:
- instrument_token (obtained from search)
- from_date: "2024-10-28 00:00:00"
- to_date: "2024-11-28 00:00:00"
- interval: "day"

**User**: "Get 15-minute candles for Nifty futures from yesterday"

**Assistant**: Uses `get_historical_data` with interval: "15minute"

## Trading Operations

### Place Market Orders

**User**: "Buy 10 shares of Infosys at market price"

**Assistant**: Uses `place_order` with:
```
variety: "regular"
exchange: "NSE"
tradingsymbol: "INFY"
transaction_type: "BUY"
quantity: 10
product: "CNC"
order_type: "MARKET"
```

**User**: "Sell 50 shares of TCS at market price for intraday"

**Assistant**: Uses `place_order` with product: "MIS" (intraday)

### Place Limit Orders

**User**: "Buy 20 shares of Wipro at limit price of 450"

**Assistant**: Uses `place_order` with:
```
order_type: "LIMIT"
price: 450
quantity: 20
```

**User**: "Place a limit order to buy 100 shares of HDFC Bank at 1600 valid for today only"

**Assistant**: Uses `place_order` with:
```
validity: "DAY"
order_type: "LIMIT"
price: 1600
```

### Place Stop-Loss Orders

**User**: "Place a stop-loss order to sell 50 shares of Reliance when it drops to 2400"

**Assistant**: Uses `place_order` with:
```
order_type: "SL"
trigger_price: 2400
transaction_type: "SELL"
```

**User**: "Set a stop-loss market order for my TCS position at 3500"

**Assistant**: Uses `place_order` with:
```
order_type: "SL-M"
trigger_price: 3500
```

### Modify Orders

**User**: "Change the price of order #240123000123456 to 460"

**Assistant**: Uses `modify_order` with:
```
order_id: "240123000123456"
price: 460
```

**User**: "Increase quantity of my pending order to 50 shares"

**Assistant**: Uses `modify_order` with:
```
quantity: 50
```

### Cancel Orders

**User**: "Cancel order #240123000123456"

**Assistant**: Uses `cancel_order` with order_id

**User**: "Cancel all my pending orders"

**Assistant**: 
1. Uses `get_orders` to list all orders
2. Filters pending orders
3. Uses `cancel_order` for each pending order

### View Orders

**User**: "Show me all my orders from today"

**Assistant**: Uses `get_orders` to list all orders

**User**: "What's the status of order #240123000123456?"

**Assistant**: Uses `get_order_history` to show order status changes

**User**: "Show me trades executed for my last order"

**Assistant**: Uses `get_order_trades` to show fills

## Portfolio Management

### View Positions

**User**: "What positions do I have open?"

**Assistant**: Uses `get_positions` to show:
- Day positions
- Net positions
- Quantity, average price
- P&L (realized and unrealized)

**User**: "Show me only positions with profit"

**Assistant**: 
1. Uses `get_positions`
2. Filters positions where P&L > 0

### View Holdings

**User**: "What stocks do I own?"

**Assistant**: Uses `get_holdings` to show:
- Trading symbol
- Quantity
- Average price
- Current price
- P&L
- Collateral available

**User**: "What's my total portfolio value?"

**Assistant**: 
1. Uses `get_holdings`
2. Calculates total value from all holdings

### View Trades

**User**: "Show me all trades executed today"

**Assistant**: Uses `get_trades` to list all trades

**User**: "What was my last trade?"

**Assistant**: Uses `get_trades` and shows the most recent trade

### View Mutual Funds

**User**: "Show my mutual fund investments"

**Assistant**: Uses `get_mf_holdings` to show MF holdings

## GTT Orders

### Single-Leg GTT

**User**: "Set a GTT to buy 50 shares of TCS when it reaches 3500"

**Assistant**: Uses `place_gtt_order` with:
```
trigger_type: "single"
trigger_value: 3500
transaction_type: "BUY"
quantity: 50
```

**User**: "Create a GTT to sell my INFY shares at 1500"

**Assistant**: Uses `place_gtt_order` with limit order at trigger price

### Two-Leg GTT (OCO - One Cancels Other)

**User**: "Set a GTT for HDFC Bank: sell at 1650 or at 1580 (target and stop-loss)"

**Assistant**: Uses `place_gtt_order` with:
```
trigger_type: "two-leg"
upper_trigger_value: 1650
upper_quantity: 100
lower_trigger_value: 1580
lower_quantity: 100
```

### Modify GTT

**User**: "Change my GTT trigger price to 3600"

**Assistant**: 
1. Uses `get_gtts` to find the GTT order
2. Uses `modify_gtt_order` to update trigger_value

### Delete GTT

**User**: "Cancel GTT order #12345"

**Assistant**: Uses `delete_gtt_order` with trigger_id

**User**: "Cancel all my GTT orders"

**Assistant**:
1. Uses `get_gtts` to list all GTTs
2. Uses `delete_gtt_order` for each GTT

## Advanced Examples

### Portfolio Analysis

**User**: "Analyze my portfolio and tell me which stocks are in profit"

**Assistant**:
1. Uses `get_holdings`
2. Calculates P&L for each holding
3. Provides analysis of profitable positions

### Market Comparison

**User**: "Compare the current prices of all IT stocks I'm watching: INFY, TCS, WIPRO, HCL"

**Assistant**:
1. Uses `get_quotes` for all instruments
2. Provides comparative analysis

### Risk Management

**User**: "Do I have any positions without stop-losses?"

**Assistant**:
1. Uses `get_positions` to list open positions
2. Uses `get_orders` to check for stop-loss orders
3. Identifies positions without protection

### Automated Trading Setup

**User**: "Set up a bracket order: buy 100 SBIN at market, with target at 650 and stop-loss at 620"

**Assistant**:
1. Uses `place_order` for main order
2. Uses `place_gtt_order` for target and stop-loss (two-leg GTT)

### Historical Analysis

**User**: "Show me the price trend of Nifty 50 for the last 30 days"

**Assistant**:
1. Uses `search_instruments` to find Nifty 50 token
2. Uses `get_historical_data` with 30-day range
3. Provides trend analysis

### Order Management

**User**: "Show me all my rejected orders and explain why"

**Assistant**:
1. Uses `get_orders`
2. Filters rejected orders
3. Uses `get_order_history` for rejection reasons

### Margin Calculation

**User**: "If I buy 200 shares of Reliance at 2500, how much margin do I need?"

**Assistant**:
1. Calculates order value (200 × 2500)
2. Uses `get_margins` to check available margin
3. Advises if transaction is possible

## Tips for Effective Usage

1. **Always authenticate first**: Start your session by logging in
2. **Use specific instrument identifiers**: Format as "EXCHANGE:SYMBOL" (e.g., "NSE:INFY")
3. **Check margins before trading**: Verify you have sufficient funds
4. **Use GTT for automated trading**: Set targets and stop-losses
5. **Monitor positions regularly**: Keep track of P&L
6. **Be specific with quantities**: Always specify exact numbers
7. **Use proper product types**: CNC for delivery, MIS for intraday
8. **Set validity**: Use DAY for regular orders, IOC for immediate execution

## Error Handling

If you encounter errors:

- **"Not authenticated"**: Run the login flow again
- **"Insufficient margin"**: Check your margins and reduce quantity
- **"Invalid trading symbol"**: Verify the symbol using search_instruments
- **"Order rejected"**: Check order parameters (price, quantity, etc.)
- **"Session expired"**: Generate a new session with request_token

## Safety Reminders

⚠️ **Important Safety Guidelines:**

1. Always verify order details before confirmation
2. Start with small quantities when testing
3. Use stop-losses for risk management
4. Monitor your positions regularly
5. Understand the risks of trading
6. Never trade with money you can't afford to lose

---

For more information, see the [main README](README.md) and [Kite Connect API documentation](https://kite.trade/docs/connect/v3/).

