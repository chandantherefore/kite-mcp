# Kite MCP Server - API Reference

Complete reference for all available MCP tools in the Kite MCP Server.

## Table of Contents

- [Authentication](#authentication)
- [Account & Profile](#account--profile)
- [Order Management](#order-management)
- [Portfolio & Positions](#portfolio--positions)
- [Market Data](#market-data)
- [GTT Orders](#gtt-orders-good-till-triggered)
- [Common Parameters](#common-parameters)
- [Response Formats](#response-formats)

---

## Authentication

### `login`

Initialize authentication flow with Kite Connect.

**Parameters:**
- `api_key` (string, required): Your Kite Connect API key
- `api_secret` (string, required): Your Kite Connect API secret

**Returns:**
- Authorization URL for user to visit
- Instructions for completing authentication

**Example:**
```json
{
  "api_key": "your_api_key",
  "api_secret": "your_api_secret"
}
```

---

### `generate_session`

Complete authentication using request token from redirect URL.

**Parameters:**
- `request_token` (string, required): Token received after authorization

**Returns:**
- `access_token`: Session access token
- `user_id`: User ID
- `login_time`: Login timestamp

**Example:**
```json
{
  "request_token": "abc123xyz456"
}
```

---

## Account & Profile

### `get_profile`

Retrieve user profile information.

**Parameters:** None

**Returns:**
- User ID and name
- Email address
- Account products
- Enabled exchanges
- Order types allowed

---

### `get_margins`

Get account margin details for equity and commodity segments.

**Parameters:** None

**Returns:**
- Available cash
- Used margin
- Available margin
- Separate equity and commodity margins

---

## Order Management

### `place_order`

Place a new order.

**Parameters:**
- `variety` (string, required): Order variety
  - `"regular"`: Regular order (default)
  - `"co"`: Cover order
  - `"amo"`: After-market order
  - `"iceberg"`: Iceberg order
  - `"auction"`: Auction order
  
- `exchange` (string, required): Exchange
  - `"NSE"`: National Stock Exchange (default)
  - `"BSE"`: Bombay Stock Exchange
  - `"MCX"`: Multi Commodity Exchange
  - `"NFO"`: NSE Futures & Options
  - `"BFO"`: BSE Futures & Options

- `tradingsymbol` (string, required): Trading symbol (e.g., "INFY", "TCS")

- `transaction_type` (string, required): Transaction type
  - `"BUY"`: Buy
  - `"SELL"`: Sell

- `quantity` (number, required): Order quantity (minimum: 1)

- `product` (string, required): Product type
  - `"CNC"`: Cash and Carry (delivery)
  - `"MIS"`: Margin Intraday Square-off
  - `"NRML"`: Normal (F&O)
  - `"MTF"`: Margin Trading Facility

- `order_type` (string, required): Order type
  - `"MARKET"`: Market order
  - `"LIMIT"`: Limit order
  - `"SL"`: Stop-loss limit order
  - `"SL-M"`: Stop-loss market order

- `price` (number, optional): Limit price (required for LIMIT orders)

- `trigger_price` (number, optional): Trigger price (required for SL/SL-M orders)

- `validity` (string, optional): Order validity
  - `"DAY"`: Valid for the day
  - `"IOC"`: Immediate or Cancel
  - `"TTL"`: Time to Live

- `validity_ttl` (number, optional): Minutes for TTL validity

- `disclosed_quantity` (number, optional): Disclosed quantity for equity

- `tag` (string, optional): Order tag (max 20 chars)

- `iceberg_legs` (number, optional): Iceberg order legs

- `iceberg_quantity` (number, optional): Iceberg order quantity per leg

**Returns:**
- `order_id`: Unique order identifier

**Example - Market Order:**
```json
{
  "variety": "regular",
  "exchange": "NSE",
  "tradingsymbol": "INFY",
  "transaction_type": "BUY",
  "quantity": 10,
  "product": "CNC",
  "order_type": "MARKET"
}
```

**Example - Limit Order:**
```json
{
  "variety": "regular",
  "exchange": "NSE",
  "tradingsymbol": "TCS",
  "transaction_type": "SELL",
  "quantity": 50,
  "product": "MIS",
  "order_type": "LIMIT",
  "price": 3500,
  "validity": "DAY"
}
```

---

### `modify_order`

Modify an existing order.

**Parameters:**
- `variety` (string, required): Order variety
- `order_id` (string, required): Order ID to modify
- `order_type` (string, required): New order type
- `quantity` (number, optional): New quantity
- `price` (number, optional): New price
- `trigger_price` (number, optional): New trigger price
- `validity` (string, optional): New validity
- `disclosed_quantity` (number, optional): New disclosed quantity

**Returns:**
- `order_id`: Modified order ID

**Example:**
```json
{
  "variety": "regular",
  "order_id": "240123000123456",
  "order_type": "LIMIT",
  "price": 3600
}
```

---

### `cancel_order`

Cancel an existing order.

**Parameters:**
- `variety` (string, required): Order variety
- `order_id` (string, required): Order ID to cancel

**Returns:**
- `order_id`: Cancelled order ID

**Example:**
```json
{
  "variety": "regular",
  "order_id": "240123000123456"
}
```

---

### `get_orders`

Get all orders for the day.

**Parameters:**
- `limit` (number, optional): Maximum orders to return
- `from` (number, optional): Starting index (0-based)

**Returns:**
Array of order objects with:
- Order ID and status
- Trading symbol and exchange
- Quantity and price details
- Timestamps

**With Pagination:**
```json
{
  "limit": 10,
  "from": 0
}
```

---

### `get_order_history`

Get complete history of an order including all modifications.

**Parameters:**
- `order_id` (string, required): Order ID

**Returns:**
Array of order state changes with timestamps

**Example:**
```json
{
  "order_id": "240123000123456"
}
```

---

### `get_order_trades`

Get all trades executed for a specific order.

**Parameters:**
- `order_id` (string, required): Order ID

**Returns:**
Array of trade objects with execution details

**Example:**
```json
{
  "order_id": "240123000123456"
}
```

---

### `get_trades`

Get all trades executed during the day.

**Parameters:**
- `limit` (number, optional): Maximum trades to return
- `from` (number, optional): Starting index (0-based)

**Returns:**
Array of trade objects

---

## Portfolio & Positions

### `get_positions`

Get current open positions.

**Parameters:**
- `limit` (number, optional): Maximum positions to return
- `from` (number, optional): Starting index (0-based)

**Returns:**
- `net`: Net positions
- `day`: Day positions
Each with:
- Trading symbol
- Quantity and average price
- Realized and unrealized P&L

---

### `get_holdings`

Get long-term equity holdings.

**Parameters:**
- `limit` (number, optional): Maximum holdings to return
- `from` (number, optional): Starting index (0-based)

**Returns:**
Array of holdings with:
- Trading symbol
- Quantity and average price
- Current price and P&L
- Collateral available

---

### `get_mf_holdings`

Get mutual fund holdings.

**Parameters:**
- `limit` (number, optional): Maximum holdings to return
- `from` (number, optional): Starting index (0-based)

**Returns:**
Array of MF holdings

---

## Market Data

### `search_instruments`

Search for trading instruments.

**Parameters:**
- `query` (string, required): Search query
- `filter_on` (string, optional): Filter field
  - `"id"`: Exchange:TradingSymbol (default)
  - `"name"`: Instrument name
  - `"isin"`: ISIN code
  - `"tradingsymbol"`: Trading symbol
  - `"underlying"`: Underlying instrument (F&O)
- `limit` (number, optional): Maximum results
- `from` (number, optional): Starting index

**Returns:**
Array of instruments with:
- Instrument token
- Trading symbol
- Exchange
- Instrument type
- Lot size

**Example:**
```json
{
  "query": "INFY",
  "filter_on": "tradingsymbol"
}
```

---

### `get_quotes`

Get detailed market quotes for instruments.

**Parameters:**
- `instruments` (array of strings, required): Instrument identifiers in format "EXCHANGE:SYMBOL" (max 500)

**Returns:**
Object with instrument data:
- Last price and OHLC
- Volume
- Bid/Ask prices
- Market depth
- Open interest (derivatives)

**Example:**
```json
{
  "instruments": ["NSE:INFY", "NSE:TCS", "NSE:WIPRO"]
}
```

---

### `get_ohlc`

Get OHLC data for instruments.

**Parameters:**
- `instruments` (array of strings, required): Instrument identifiers

**Returns:**
OHLC data for each instrument:
- Open, High, Low, Close
- Last traded price

**Example:**
```json
{
  "instruments": ["NSE:SBIN", "NSE:HDFCBANK"]
}
```

---

### `get_ltp`

Get last traded price for instruments.

**Parameters:**
- `instruments` (array of strings, required): Instrument identifiers

**Returns:**
Last traded price for each instrument

**Example:**
```json
{
  "instruments": ["NSE:INFY", "NSE:TCS"]
}
```

---

### `get_historical_data`

Get historical candle data for an instrument.

**Parameters:**
- `instrument_token` (number, required): Instrument token
- `from_date` (string, required): Start date (YYYY-MM-DD HH:MM:SS)
- `to_date` (string, required): End date (YYYY-MM-DD HH:MM:SS)
- `interval` (string, required): Candle interval
  - `"minute"`: 1-minute
  - `"3minute"`: 3-minute
  - `"5minute"`: 5-minute
  - `"10minute"`: 10-minute
  - `"15minute"`: 15-minute
  - `"30minute"`: 30-minute
  - `"60minute"`: 60-minute
  - `"day"`: Daily
- `continuous` (boolean, optional): Continuous data for F&O (default: false)
- `oi` (boolean, optional): Include open interest (default: false)

**Returns:**
Array of candles with:
- Date/time
- Open, High, Low, Close
- Volume
- Open interest (if requested)

**Example:**
```json
{
  "instrument_token": 738561,
  "from_date": "2024-11-01 00:00:00",
  "to_date": "2024-11-28 00:00:00",
  "interval": "day"
}
```

---

## GTT Orders (Good Till Triggered)

### `place_gtt_order`

Place a GTT order.

**Parameters:**
- `trigger_type` (string, required): GTT type
  - `"single"`: Single trigger
  - `"two-leg"`: Two triggers (OCO)
  
- `exchange` (string, required): Exchange
- `tradingsymbol` (string, required): Trading symbol
- `last_price` (number, required): Last price of instrument
- `transaction_type` (string, required): BUY or SELL
- `product` (string, required): Product type

**For Single-Leg:**
- `trigger_value` (number): Trigger price
- `quantity` (number): Order quantity
- `limit_price` (number, optional): Limit price

**For Two-Leg:**
- `upper_trigger_value` (number): Upper trigger
- `upper_quantity` (number): Upper quantity
- `upper_limit_price` (number, optional): Upper limit price
- `lower_trigger_value` (number): Lower trigger
- `lower_quantity` (number): Lower quantity
- `lower_limit_price` (number, optional): Lower limit price

**Returns:**
- `trigger_id`: GTT order ID

**Example - Single Leg:**
```json
{
  "trigger_type": "single",
  "exchange": "NSE",
  "tradingsymbol": "INFY",
  "last_price": 1450,
  "transaction_type": "SELL",
  "product": "CNC",
  "trigger_value": 1500,
  "quantity": 50,
  "limit_price": 1505
}
```

**Example - Two Leg (OCO):**
```json
{
  "trigger_type": "two-leg",
  "exchange": "NSE",
  "tradingsymbol": "TCS",
  "last_price": 3500,
  "transaction_type": "SELL",
  "product": "CNC",
  "upper_trigger_value": 3650,
  "upper_quantity": 100,
  "upper_limit_price": 3655,
  "lower_trigger_value": 3400,
  "lower_quantity": 100,
  "lower_limit_price": 3395
}
```

---

### `modify_gtt_order`

Modify an existing GTT order.

**Parameters:**
- `trigger_id` (number, required): GTT order ID
- All other parameters same as `place_gtt_order`

**Returns:**
- `trigger_id`: Modified GTT order ID

---

### `delete_gtt_order`

Delete a GTT order.

**Parameters:**
- `trigger_id` (number, required): GTT order ID

**Returns:**
- `trigger_id`: Deleted GTT order ID

**Example:**
```json
{
  "trigger_id": 12345
}
```

---

### `get_gtts`

Get all active GTT orders.

**Parameters:**
- `limit` (number, optional): Maximum GTTs to return
- `from` (number, optional): Starting index

**Returns:**
Array of GTT orders

---

## Common Parameters

### Exchange Codes
- `NSE`: National Stock Exchange (equities)
- `BSE`: Bombay Stock Exchange (equities)
- `NFO`: NSE Futures & Options
- `BFO`: BSE Futures & Options
- `MCX`: Multi Commodity Exchange

### Product Types
- `CNC`: Cash and Carry (delivery)
- `MIS`: Margin Intraday Square-off
- `NRML`: Normal (F&O)
- `MTF`: Margin Trading Facility

### Order Types
- `MARKET`: Execute at market price
- `LIMIT`: Execute at or better than limit price
- `SL`: Stop-loss limit order
- `SL-M`: Stop-loss market order

### Transaction Types
- `BUY`: Buy order
- `SELL`: Sell order

### Order Validity
- `DAY`: Valid for trading day
- `IOC`: Immediate or Cancel
- `TTL`: Time to Live (specify minutes)

---

## Response Formats

All tools return responses in JSON format with the following structure:

### Success Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "JSON formatted response data"
    }
  ]
}
```

### Error Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: [error message]"
    }
  ],
  "isError": true
}
```

### Paginated Response
When using pagination parameters:
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "from": 0,
    "limit": 10,
    "returned": 10
  }
}
```

---

## Rate Limits

Kite Connect API has the following rate limits:
- **3 requests per second** per API key
- Some endpoints have additional specific limits

The MCP server does not implement client-side rate limiting, so be mindful of request frequency.

---

## Error Codes

Common error responses:

- **"Not authenticated"**: Complete the login flow first
- **"Insufficient margin"**: Insufficient funds for order
- **"Invalid trading symbol"**: Symbol not found or invalid format
- **"Order rejected"**: Order validation failed
- **"Session expired"**: Access token expired, re-authenticate
- **"Rate limit exceeded"**: Too many requests

---

## Additional Resources

- [Kite Connect API Documentation](https://kite.trade/docs/connect/v3/)
- [kiteconnectjs Library Docs](https://kite.trade/docs/kiteconnectjs/v5/)
- [Usage Examples](USAGE_EXAMPLES.md)
- [Quick Start Guide](QUICKSTART.md)

---

**Note**: All prices are in INR (Indian Rupees). All times are in IST (Indian Standard Time).

