import { KiteConnect } from 'kiteconnect';
import { promises as fs } from 'fs';
import { homedir } from 'os';
import path from 'path';

interface KiteCredentials {
  api_key?: string;
  api_secret?: string;
  access_token?: string;
  request_token?: string;
}

interface KiteSession {
  kc: any; // KiteConnect instance (using any due to type issues)
  credentials: KiteCredentials;
}

interface AccountConfig {
  id: string;
  name: string;
  apiKey: string;
  apiSecret: string;
}

// Path to store credentials
const CREDENTIALS_PATH = path.join(homedir(), '.kite-mcp-credentials.json');

// In-memory session storage
const sessions = new Map<string, KiteSession>();
let accountsConfig: AccountConfig[] = [];

// Load accounts from environment variables
function loadAccountsConfig(): AccountConfig[] {
  const accounts: AccountConfig[] = [];
  let index = 1;

  while (true) {
    const id = process.env[`KITE_ACC_${index}_ID`];
    const name = process.env[`KITE_ACC_${index}_NAME`];
    const apiKey = process.env[`KITE_ACC_${index}_KEY`];
    const apiSecret = process.env[`KITE_ACC_${index}_SECRET`];

    if (!id || !apiKey || !apiSecret) {
      break;
    }

    accounts.push({
      id,
      name: name || id,
      apiKey,
      apiSecret,
    });

    index++;
  }

  return accounts;
}

// Initialize accounts config on module load
if (accountsConfig.length === 0) {
  accountsConfig = loadAccountsConfig();
}

// Load saved credentials
async function loadCredentials(): Promise<void> {
  try {
    const data = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const savedSessions: Record<string, KiteCredentials> = JSON.parse(data);

    for (const [clientId, credentials] of Object.entries(savedSessions)) {
      if (credentials.api_key && credentials.access_token) {
        const kc = new KiteConnect({ api_key: credentials.api_key });
        kc.setAccessToken(credentials.access_token);
        sessions.set(clientId, { kc, credentials });
      }
    }
  } catch (error) {
    // File doesn't exist yet
  }
}

// Save credentials
async function saveCredentials(): Promise<void> {
  const credentialsMap: Record<string, KiteCredentials> = {};
  
  for (const [clientId, session] of sessions.entries()) {
    credentialsMap[clientId] = session.credentials;
  }

  await fs.writeFile(
    CREDENTIALS_PATH,
    JSON.stringify(credentialsMap, null, 2),
    'utf-8'
  );
}

// Get session for a client
function getSession(clientId?: string): KiteSession {
  if (!clientId) {
    if (sessions.size === 1) {
      return Array.from(sessions.values())[0];
    } else if (sessions.size === 0) {
      throw new Error('Not authenticated. Please login first.');
    } else {
      const availableIds = Array.from(sessions.keys()).join(', ');
      throw new Error(
        `Multiple accounts available (${availableIds}). Please specify 'client_id' parameter.`
      );
    }
  }

  const session = sessions.get(clientId);
  if (!session || !session.credentials.access_token) {
    throw new Error(`Not authenticated for client_id '${clientId}'. Please login first.`);
  }

  return session;
}

// Get account config
function getAccountConfig(clientId: string): AccountConfig | undefined {
  return accountsConfig.find(acc => acc.id === clientId);
}

// Initialize - load credentials on first call
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await loadCredentials();
    initialized = true;
  }
}

// Tool implementations
export async function executeKiteTool(tool: string, args: any = {}) {
  await ensureInitialized();

  try {
    switch (tool) {
      case 'list_accounts':
        return {
          accounts: accountsConfig.map(acc => ({ id: acc.id, name: acc.name }))
        };

      case 'login': {
        const { client_id, api_key, api_secret } = args;
        const config = getAccountConfig(client_id);
        
        const finalApiKey = api_key || config?.apiKey;
        const finalApiSecret = api_secret || config?.apiSecret;

        if (!finalApiKey || !finalApiSecret) {
          throw new Error(
            `Cannot find API credentials for client_id '${client_id}'. Configure in .env.local.`
          );
        }

        const credentials: KiteCredentials = {
          api_key: finalApiKey,
          api_secret: finalApiSecret,
        };

        const kc = new KiteConnect({ api_key: finalApiKey });
        const loginUrl = kc.getLoginURL();

        sessions.set(client_id, { kc, credentials });
        await saveCredentials();

        return {
          message: `Please authorize account '${client_id}' at:\n\n${loginUrl}\n\nThen call generate_session with the request_token.`,
          loginUrl
        };
      }

      case 'generate_session': {
        const { client_id, request_token } = args;
        const session = sessions.get(client_id);
        
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

        await saveCredentials();

        return {
          message: `Session generated for '${client_id}'!`,
          access_token: response.access_token,
          user_id: response.user_id,
          login_time: response.login_time
        };
      }

      case 'get_profile': {
        const session = getSession(args.client_id);
        return await session.kc.getProfile();
      }

      case 'get_margins': {
        const session = getSession(args.client_id);
        return await session.kc.getMargins();
      }

      case 'get_holdings': {
        const session = getSession(args.client_id);
        const holdings = await session.kc.getHoldings();
        
        if (args.limit || args.from) {
          const from = args.from || 0;
          const limit = args.limit || holdings.length;
          const paginated = holdings.slice(from, from + limit);
          
          return {
            holdings: paginated,
            pagination: {
              total: holdings.length,
              from,
              limit,
              returned: paginated.length,
            },
          };
        }
        
        return holdings;
      }

      case 'get_mf_holdings': {
        const session = getSession(args.client_id);
        const holdings = await session.kc.getMFHoldings();
        
        if (args.limit || args.from) {
          const from = args.from || 0;
          const limit = args.limit || holdings.length;
          const paginated = holdings.slice(from, from + limit);
          
          return {
            mf_holdings: paginated,
            pagination: {
              total: holdings.length,
              from,
              limit,
              returned: paginated.length,
            },
          };
        }
        
        return holdings;
      }

      case 'get_positions': {
        const session = getSession(args.client_id);
        const positions = await session.kc.getPositions();
        
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
            limit: limit || 'all',
          };
          
          return result;
        }
        
        return positions;
      }

      case 'get_orders': {
        const session = getSession(args.client_id);
        const orders = await session.kc.getOrders();
        
        if (args.limit || args.from) {
          const from = args.from || 0;
          const limit = args.limit || orders.length;
          const paginated = orders.slice(from, from + limit);
          
          return {
            orders: paginated,
            pagination: {
              total: orders.length,
              from,
              limit,
              returned: paginated.length,
            },
          };
        }
        
        return orders;
      }

      case 'place_order': {
        const session = getSession(args.client_id);
        return await session.kc.placeOrder(args.variety, args);
      }

      case 'modify_order': {
        const session = getSession(args.client_id);
        return await session.kc.modifyOrder(args.variety, args.order_id, args);
      }

      case 'cancel_order': {
        const session = getSession(args.client_id);
        return await session.kc.cancelOrder(args.variety, args.order_id);
      }

      case 'get_quotes': {
        const session = getSession(args.client_id);
        return await session.kc.getQuote(args.instruments);
      }

      case 'get_ltp': {
        const session = getSession(args.client_id);
        return await session.kc.getLTP(args.instruments);
      }

      default:
        throw new Error(`Tool '${tool}' not yet implemented`);
    }
  } catch (error: any) {
    console.error(`Error executing tool ${tool}:`, error);
    throw new Error(error.message || 'Failed to execute tool');
  }
}
