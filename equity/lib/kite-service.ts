import { KiteConnect } from 'kiteconnect';
import { promises as fs } from 'fs';
import { homedir } from 'os';
import path from 'path';
import { db } from './db';

interface KiteCredentials {
  api_key?: string;
  api_secret?: string;
  access_token?: string;
  request_token?: string;
}

interface KiteSession {
  kc: any; // KiteConnect instance (using any due to type issues)
  credentials: KiteCredentials;
  accountId: number;
  userId: number;
}

// Path to store credentials (for backward compatibility during migration)
const CREDENTIALS_PATH = path.join(homedir(), '.kite-mcp-credentials.json');

// In-memory session storage
const sessions = new Map<number, KiteSession>(); // Key is account ID

// Load saved credentials from file (for backward compatibility)
async function loadCredentialsFromFile(): Promise<void> {
  try {
    const data = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const savedSessions: Record<string, KiteCredentials> = JSON.parse(data);

    for (const [clientId, credentials] of Object.entries(savedSessions)) {
      if (credentials.api_key && credentials.access_token) {
        // Try to find account by api_key
        // This is a migration helper - in production, sessions should be loaded from DB
        const kc = new KiteConnect({ api_key: credentials.api_key });
        kc.setAccessToken(credentials.access_token);
        // Note: We can't map old client_id to account_id without additional logic
        // This is mainly for backward compatibility during migration
      }
    }
  } catch (error) {
    // File doesn't exist yet
  }
}

// Load session from database
async function loadSessionFromDB(accountId: number, userId: number): Promise<KiteSession | undefined> {
  try {
    const account = await db.getAccountById(accountId, userId);

    if (!account || !account.api_key || !account.api_secret) {
      return undefined;
    }

    const credentials: KiteCredentials = {
      api_key: account.api_key,
      api_secret: account.api_secret,
      access_token: account.access_token || undefined,
    };

    const kc = new KiteConnect({ api_key: account.api_key });

    if (account.access_token) {
      kc.setAccessToken(account.access_token);
    }

    return {
      kc,
      credentials,
      accountId,
      userId,
    };
  } catch (error) {
    console.error(`[KiteService] Error loading session for account ${accountId}:`, error);
    return undefined;
  }
}

// Save access token to database
async function saveAccessTokenToDB(accountId: number, userId: number, accessToken: string, expiresAt?: Date): Promise<void> {
  try {
    await db.updateAccountAccessToken(accountId, userId, accessToken, expiresAt);
  } catch (error) {
    console.error(`[KiteService] Error saving access token for account ${accountId}:`, error);
    throw error;
  }
}

// Get session for an account
async function getSession(accountId: number, userId: number): Promise<KiteSession> {
  // Check in-memory cache first
  let session = sessions.get(accountId);

  if (session && session.credentials.access_token) {
    return session;
  }

  // Load from database
  session = await loadSessionFromDB(accountId, userId);

  if (!session) {
    throw new Error(`Account ${accountId} not found or missing API credentials. Please configure API key and secret.`);
  }

  if (!session.credentials.access_token) {
    throw new Error(`Account ${accountId} is not authenticated. Please login first.`);
  }

  // Cache in memory
  sessions.set(accountId, session);

  return session;
}

// Initialize - load credentials on first call
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    console.log('[KiteService] Initializing...');
    await loadCredentialsFromFile(); // For backward compatibility
    console.log(`[KiteService] Initialized. Sessions will be loaded from database on demand.`);
    initialized = true;
  }
}

// Tool implementations
export async function executeKiteTool(tool: string, args: any = {}) {
  await ensureInitialized();

  try {
    switch (tool) {
      case 'list_accounts': {
        // This is now handled by the API endpoint that queries the database
        // Return empty array as accounts are managed via /api/accounts
        return { accounts: [] };
      }

      case 'login': {
        const { account_id, user_id } = args;

        if (!account_id || !user_id) {
          throw new Error('account_id and user_id are required');
        }

        const account = await db.getAccountById(account_id, user_id);

        if (!account) {
          throw new Error(`Account ${account_id} not found.`);
        }

        if (!account.api_key || !account.api_secret) {
          throw new Error(
            `Cannot find API credentials for account ${account_id}. Please configure API key and secret in account settings.`
          );
        }

        const credentials: KiteCredentials = {
          api_key: account.api_key,
          api_secret: account.api_secret,
        };

        const kc = new KiteConnect({ api_key: account.api_key });
        const loginUrl = kc.getLoginURL();

        const session: KiteSession = {
          kc,
          credentials,
          accountId: account_id,
          userId: user_id,
        };

        sessions.set(account_id, session);

        return {
          message: `Please authorize account '${account.name}' at:\n\n${loginUrl}\n\nThen call generate_session with the request_token.`,
          loginUrl
        };
      }

      case 'generate_session': {
        const { account_id, user_id, request_token } = args;

        if (!account_id || !user_id || !request_token) {
          throw new Error('account_id, user_id, and request_token are required');
        }

        let session = sessions.get(account_id);

        if (!session) {
          const loadedSession = await loadSessionFromDB(account_id, user_id);
          if (!loadedSession) {
            throw new Error(`Please call 'login' first for account ${account_id}.`);
          }
          session = loadedSession;
        }

        if (!session.credentials.api_secret) {
          throw new Error(`Please call 'login' first for account ${account_id}.`);
        }

        const response = await session.kc.generateSession(
          request_token,
          session.credentials.api_secret
        );

        session.credentials.access_token = response.access_token;
        session.credentials.request_token = request_token;
        session.kc.setAccessToken(response.access_token);

        // Save to database
        // Kite tokens typically expire at end of day, but we'll set expires_at to null for now
        // You can calculate expiry based on login_time if needed
        await saveAccessTokenToDB(account_id, user_id, response.access_token);

        // Update in-memory cache
        sessions.set(account_id, session);

        return {
          message: `Session generated for account ${account_id}!`,
          access_token: response.access_token,
          user_id: response.user_id,
          login_time: response.login_time
        };
      }

      case 'get_profile': {
        const { account_id, user_id } = args;
        if (!account_id || !user_id) {
          throw new Error('account_id and user_id are required');
        }
        const session = await getSession(account_id, user_id);
        return await session.kc.getProfile();
      }

      case 'get_margins': {
        const { account_id, user_id } = args;
        if (!account_id || !user_id) {
          throw new Error('account_id and user_id are required');
        }
        const session = await getSession(account_id, user_id);
        return await session.kc.getMargins();
      }

      case 'get_holdings': {
        const { account_id, user_id } = args;
        if (!account_id || !user_id) {
          throw new Error('account_id and user_id are required');
        }
        const session = await getSession(account_id, user_id);
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
        const { account_id, user_id } = args;
        if (!account_id || !user_id) {
          throw new Error('account_id and user_id are required');
        }
        const session = await getSession(account_id, user_id);
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
        const { account_id, user_id } = args;
        if (!account_id || !user_id) {
          throw new Error('account_id and user_id are required');
        }
        const session = await getSession(account_id, user_id);
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
        const { account_id, user_id } = args;
        if (!account_id || !user_id) {
          throw new Error('account_id and user_id are required');
        }
        const session = await getSession(account_id, user_id);
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
        const { account_id, user_id } = args;
        if (!account_id || !user_id) {
          throw new Error('account_id and user_id are required');
        }
        const session = await getSession(account_id, user_id);
        return await session.kc.placeOrder(args.variety, args);
      }

      case 'modify_order': {
        const { account_id, user_id } = args;
        if (!account_id || !user_id) {
          throw new Error('account_id and user_id are required');
        }
        const session = await getSession(account_id, user_id);
        return await session.kc.modifyOrder(args.variety, args.order_id, args);
      }

      case 'cancel_order': {
        const { account_id, user_id } = args;
        if (!account_id || !user_id) {
          throw new Error('account_id and user_id are required');
        }
        const session = await getSession(account_id, user_id);
        return await session.kc.cancelOrder(args.variety, args.order_id);
      }

      case 'get_quotes': {
        const { account_id, user_id } = args;
        if (!account_id || !user_id) {
          throw new Error('account_id and user_id are required');
        }
        const session = await getSession(account_id, user_id);
        return await session.kc.getQuote(args.instruments);
      }

      case 'get_ltp': {
        const { account_id, user_id } = args;
        if (!account_id || !user_id) {
          throw new Error('account_id and user_id are required');
        }
        console.log('[KiteService] get_ltp called with instruments:', args.instruments?.length, 'items');
        const session = await getSession(account_id, user_id);
        const result = await session.kc.getLTP(args.instruments);
        console.log('[KiteService] get_ltp result received');
        return result;
      }

      default:
        throw new Error(`Tool '${tool}' not yet implemented`);
    }
  } catch (error: any) {
    console.error(`Error executing tool ${tool}:`, error);
    throw new Error(error.message || 'Failed to execute tool');
  }
}
