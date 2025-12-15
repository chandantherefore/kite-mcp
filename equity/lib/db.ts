import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'db',
  password: process.env.DATABASE_PASSWORD || 'db',
  database: process.env.DATABASE_NAME || 'oneapp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool
let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Execute a query
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const connection = await getPool().getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows as T[];
  } finally {
    connection.release();
  }
}

// Execute a query and return the first row
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Execute an insert and return the inserted ID
export async function insert(sql: string, params?: any[]): Promise<number> {
  const connection = await getPool().getConnection();
  try {
    const [result] = await connection.execute(sql, params);
    return (result as any).insertId;
  } finally {
    connection.release();
  }
}

// Execute an update/delete and return affected rows
export async function execute(sql: string, params?: any[]): Promise<number> {
  const connection = await getPool().getConnection();
  try {
    const [result] = await connection.execute(sql, params);
    return (result as any).affectedRows;
  } finally {
    connection.release();
  }
}

// Transaction support
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Close the pool (for graceful shutdown)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Type definitions for our database models
export interface User {
  id: number;
  username: string;
  email: string;
  password: string | null;
  first_name: string;
  last_name: string;
  dob: Date;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  expertise_level: '0-1' | '1-5' | '5-10' | '10+';
  role: 'user' | 'admin';
  is_active: boolean;
  email_verified: boolean;
  verification_token: string | null;
  verification_token_expires: Date | null;
  google_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Account {
  id: number;
  user_id: number;
  name: string;
  broker_id: string | null;
  api_key: string | null;
  api_secret: string | null;
  access_token: string | null;
  access_token_expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
  last_tradebook_sync: Date | null;
  last_ledger_sync: Date | null;
  tradebook_records_count: number;
  ledger_records_count: number;
}

export interface Trade {
  id: number;
  account_id: number;
  symbol: string;
  isin: string | null;
  trade_date: Date;
  exchange: string | null;
  segment: string | null;
  series: string | null;
  trade_type: 'buy' | 'sell';
  auction: boolean;
  quantity: number;
  price: number;
  trade_id: string | null;
  order_id: string | null;
  order_execution_time: Date | null;
  created_at: Date;
  import_batch_id: string | null;
  import_date: Date | null;
}

export interface Ledger {
  id: number;
  account_id: number;
  particular: string | null;
  posting_date: Date;
  cost_center: string | null;
  voucher_type: string | null;
  debit: number;
  credit: number;
  net_balance: number | null;
  created_at: Date;
  import_batch_id: string | null;
  import_date: Date | null;
}

export interface ImportConflict {
  id: number;
  account_id: number;
  import_type: 'tradebook' | 'ledger';
  conflict_type: string;
  existing_data: any;
  new_data: any;
  conflict_field: string | null;
  status: 'pending' | 'resolved_keep_existing' | 'resolved_use_new' | 'resolved_manual' | 'ignored';
  resolved_at: Date | null;
  resolved_by: string | null;
  created_at: Date;
}

// Helper functions for common queries
export const db = {
  // User queries
  async createUser(user: {
    username: string;
    email: string;
    password: string | null;
    first_name: string;
    last_name: string;
    dob: string;
    gender: string;
    expertise_level: string;
    google_id?: string | null;
    is_active?: boolean;
    email_verified?: boolean;
  }): Promise<number> {
    return insert(
      `INSERT INTO users (username, email, password, first_name, last_name, dob, gender, expertise_level, google_id, is_active, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.username,
        user.email,
        user.password,
        user.first_name,
        user.last_name,
        user.dob,
        user.gender,
        user.expertise_level,
        user.google_id || null,
        user.is_active ?? false,
        user.email_verified ?? false,
      ]
    );
  },

  async findUserByEmail(email: string): Promise<User | null> {
    return queryOne<User>('SELECT * FROM users WHERE email = ?', [email]);
  },

  async findUserByUsername(username: string): Promise<User | null> {
    return queryOne<User>('SELECT * FROM users WHERE username = ?', [username]);
  },

  async findUserById(id: number): Promise<User | null> {
    return queryOne<User>('SELECT * FROM users WHERE id = ?', [id]);
  },

  async findUserByGoogleId(googleId: string): Promise<User | null> {
    return queryOne<User>('SELECT * FROM users WHERE google_id = ?', [googleId]);
  },

  async setVerificationToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    await execute(
      'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
      [token, expiresAt, userId]
    );
  },

  async verifyUserByToken(token: string): Promise<boolean> {
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE verification_token = ? AND verification_token_expires > NOW()',
      [token]
    );

    if (!user) {
      return false;
    }

    await execute(
      'UPDATE users SET is_active = TRUE, email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
      [user.id]
    );

    return true;
  },

  async getAllUsers(): Promise<User[]> {
    return query<User>('SELECT * FROM users ORDER BY created_at DESC');
  },

  async toggleUserActive(userId: number, isActive: boolean): Promise<void> {
    await execute('UPDATE users SET is_active = ? WHERE id = ?', [isActive, userId]);
  },

  async updateUserRole(userId: number, role: 'user' | 'admin'): Promise<void> {
    await execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
  },

  async deleteUser(userId: number): Promise<void> {
    await execute('DELETE FROM users WHERE id = ?', [userId]);
  },

  // Account queries (user-specific)
  async getAccounts(userId: number): Promise<Account[]> {
    return query<Account>('SELECT * FROM accounts WHERE user_id = ? ORDER BY name', [userId]);
  },

  async getAccountById(id: number, userId: number): Promise<Account | null> {
    return queryOne<Account>('SELECT * FROM accounts WHERE id = ? AND user_id = ?', [id, userId]);
  },

  async createAccount(userId: number, name: string, brokerId?: string, apiKey?: string, apiSecret?: string): Promise<number> {
    return insert(
      'INSERT INTO accounts (user_id, name, broker_id, api_key, api_secret) VALUES (?, ?, ?, ?, ?)',
      [userId, name, brokerId || null, apiKey || null, apiSecret || null]
    );
  },

  async updateAccount(id: number, userId: number, name: string, brokerId?: string, apiKey?: string, apiSecret?: string): Promise<number> {
    return execute(
      'UPDATE accounts SET name = ?, broker_id = ?, api_key = ?, api_secret = ? WHERE id = ? AND user_id = ?',
      [name, brokerId || null, apiKey || null, apiSecret || null, id, userId]
    );
  },

  async updateAccountAccessToken(id: number, userId: number, accessToken: string, expiresAt?: Date): Promise<number> {
    return execute(
      'UPDATE accounts SET access_token = ?, access_token_expires_at = ? WHERE id = ? AND user_id = ?',
      [accessToken, expiresAt || null, id, userId]
    );
  },

  async clearAccountAccessToken(id: number, userId: number): Promise<number> {
    return execute(
      'UPDATE accounts SET access_token = NULL, access_token_expires_at = NULL WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  },

  async deleteAccount(id: number, userId: number): Promise<number> {
    return execute('DELETE FROM accounts WHERE id = ? AND user_id = ?', [id, userId]);
  },

  // Trade queries (user-specific via account ownership)
  async getTrades(userId: number, accountId?: number, symbol?: string): Promise<Trade[]> {
    let sql = `
      SELECT t.* FROM trades t
      INNER JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = ?
    `;
    const params: any[] = [userId];

    if (accountId) {
      sql += ' AND t.account_id = ?';
      params.push(accountId);
    }

    if (symbol) {
      sql += ' AND t.symbol = ?';
      params.push(symbol);
    }

    sql += ' ORDER BY t.trade_date DESC';

    return query<Trade>(sql, params);
  },

  async insertTrade(trade: Omit<Trade, 'id' | 'created_at'>): Promise<number> {
    return insert(
      `INSERT INTO trades (
        account_id, symbol, isin, trade_date, exchange, segment, series,
        trade_type, auction, quantity, price, trade_id, order_id, order_execution_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        quantity = VALUES(quantity),
        price = VALUES(price)`,
      [
        trade.account_id,
        trade.symbol,
        trade.isin,
        trade.trade_date,
        trade.exchange,
        trade.segment,
        trade.series,
        trade.trade_type,
        trade.auction,
        trade.quantity,
        trade.price,
        trade.trade_id,
        trade.order_id,
        trade.order_execution_time,
      ]
    );
  },

  async getTradeById(id: number, userId: number): Promise<Trade | null> {
    return queryOne<Trade>(
      `SELECT t.* FROM trades t
       INNER JOIN accounts a ON t.account_id = a.id
       WHERE t.id = ? AND a.user_id = ?`,
      [id, userId]
    );
  },

  async updateTrade(
    id: number,
    userId: number,
    updates: {
      symbol?: string;
      quantity?: number;
      price?: number;
    }
  ): Promise<void> {
    const setClauses: string[] = [];
    const params: any[] = [];

    if (updates.symbol !== undefined) {
      setClauses.push('t.symbol = ?');
      params.push(updates.symbol);
    }

    if (updates.quantity !== undefined) {
      setClauses.push('t.quantity = ?');
      params.push(updates.quantity);
    }

    if (updates.price !== undefined) {
      setClauses.push('t.price = ?');
      params.push(updates.price);
    }

    if (setClauses.length === 0) {
      return; // Nothing to update
    }

    params.push(id, userId);

    await execute(
      `UPDATE trades t
       INNER JOIN accounts a ON t.account_id = a.id
       SET ${setClauses.join(', ')}
       WHERE t.id = ? AND a.user_id = ?`,
      params
    );
  },

  async deleteTrade(id: number, userId: number): Promise<void> {
    await execute(
      `DELETE t FROM trades t
       INNER JOIN accounts a ON t.account_id = a.id
       WHERE t.id = ? AND a.user_id = ?`,
      [id, userId]
    );
  },

  // Ledger queries (user-specific via account ownership)
  async getLedger(userId: number, accountId?: number): Promise<Ledger[]> {
    let sql = `
      SELECT l.* FROM ledger l
      INNER JOIN accounts a ON l.account_id = a.id
      WHERE a.user_id = ?
    `;
    const params: any[] = [userId];

    if (accountId) {
      sql += ' AND l.account_id = ?';
      params.push(accountId);
    }

    sql += ' ORDER BY l.posting_date DESC';

    return query<Ledger>(sql, params);
  },

  async insertLedger(ledger: Omit<Ledger, 'id' | 'created_at'>): Promise<number> {
    return insert(
      `INSERT INTO ledger (
        account_id, particular, posting_date, cost_center, voucher_type,
        debit, credit, net_balance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ledger.account_id,
        ledger.particular,
        ledger.posting_date,
        ledger.cost_center,
        ledger.voucher_type,
        ledger.debit,
        ledger.credit,
        ledger.net_balance,
      ]
    );
  },

  // Portfolio analytics queries (user-specific via account ownership)
  async getHoldings(userId: number, accountId?: number, includeClosedPositions: boolean = false): Promise<any[]> {
    // Always group by symbol AND account_id to show separate holdings per account
    let sql = `
      SELECT 
        t.symbol,
        t.account_id,
        a.name as account_name,
        SUM(CASE WHEN t.trade_type = 'buy' THEN t.quantity ELSE -t.quantity END) as quantity,
        SUM(CASE WHEN t.trade_type = 'buy' THEN t.quantity * t.price ELSE 0 END) / 
          NULLIF(SUM(CASE WHEN t.trade_type = 'buy' THEN t.quantity ELSE 0 END), 0) as avg_price
      FROM trades t
      INNER JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = ?
    `;
    const params: any[] = [userId];

    if (accountId) {
      sql += ' AND t.account_id = ?';
      params.push(accountId);
    }

    sql += ' GROUP BY t.symbol, t.account_id, a.name';

    if (!includeClosedPositions) {
      sql += ' HAVING quantity > 0';
    }

    sql += ' ORDER BY t.symbol, a.name';

    return query(sql, params);
  },

  async getCashFlows(userId: number, accountId?: number): Promise<any[]> {
    let sql = `
      SELECT 
        l.posting_date as date,
        (l.credit - l.debit) as amount
      FROM ledger l
      INNER JOIN accounts a ON l.account_id = a.id
      WHERE a.user_id = ?
    `;
    const params: any[] = [userId];

    if (accountId) {
      sql += ' AND l.account_id = ?';
      params.push(accountId);
    }

    sql += ' ORDER BY l.posting_date';

    return query(sql, params);
  },

  async getTradesForSymbol(symbol: string, userId: number, accountId?: number): Promise<Trade[]> {
    let sql = `
      SELECT t.* FROM trades t
      INNER JOIN accounts a ON t.account_id = a.id
      WHERE t.symbol = ? AND a.user_id = ?
    `;
    const params: any[] = [symbol, userId];

    if (accountId) {
      sql += ' AND t.account_id = ?';
      params.push(accountId);
    }

    sql += ' ORDER BY t.trade_date';

    return query<Trade>(sql, params);
  },

  // Conflict management (user-specific via account ownership)
  async getConflicts(userId: number, accountId?: number, status?: string): Promise<ImportConflict[]> {
    let sql = `
      SELECT ic.* FROM import_conflicts ic
      INNER JOIN accounts a ON ic.account_id = a.id
      WHERE a.user_id = ?
    `;
    const params: any[] = [userId];

    if (accountId) {
      sql += ' AND ic.account_id = ?';
      params.push(accountId);
    }

    if (status) {
      sql += ' AND ic.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY ic.created_at DESC';

    return query<ImportConflict>(sql, params);
  },

  async createConflict(conflict: Omit<ImportConflict, 'id' | 'created_at'>): Promise<number> {
    return insert(
      `INSERT INTO import_conflicts (
        account_id, import_type, conflict_type, existing_data, new_data,
        conflict_field, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        conflict.account_id,
        conflict.import_type,
        conflict.conflict_type,
        JSON.stringify(conflict.existing_data),
        JSON.stringify(conflict.new_data),
        conflict.conflict_field,
        conflict.status,
      ]
    );
  },

  async resolveConflict(id: number, userId: number, status: string, resolvedBy?: string): Promise<number> {
    return execute(
      `UPDATE import_conflicts ic
       INNER JOIN accounts a ON ic.account_id = a.id
       SET ic.status = ?, ic.resolved_at = NOW(), ic.resolved_by = ?
       WHERE ic.id = ? AND a.user_id = ?`,
      [status, resolvedBy || 'system', id, userId]
    );
  },

  async deleteConflict(id: number, userId: number): Promise<number> {
    return execute(
      `DELETE ic FROM import_conflicts ic
       INNER JOIN accounts a ON ic.account_id = a.id
       WHERE ic.id = ? AND a.user_id = ?`,
      [id, userId]
    );
  },

  // Update account sync timestamps
  async updateAccountSync(accountId: number, type: 'tradebook' | 'ledger', recordCount: number): Promise<number> {
    if (type === 'tradebook') {
      return execute(
        'UPDATE accounts SET last_tradebook_sync = NOW(), tradebook_records_count = tradebook_records_count + ? WHERE id = ?',
        [recordCount, accountId]
      );
    } else {
      return execute(
        'UPDATE accounts SET last_ledger_sync = NOW(), ledger_records_count = ledger_records_count + ? WHERE id = ?',
        [recordCount, accountId]
      );
    }
  },

  // Apply stock split (user-specific via account ownership)
  async applyStockSplit(
    userId: number,
    accountId: number,
    symbol: string,
    splitDate: Date,
    oldRatio: number,
    newRatio: number
  ): Promise<number> {
    const multiplier = newRatio / oldRatio;
    return execute(
      `UPDATE trades t
       INNER JOIN accounts a ON t.account_id = a.id
       SET t.quantity = t.quantity * ?, 
           t.price = t.price / ?
       WHERE a.user_id = ?
         AND t.account_id = ? 
         AND t.symbol = ? 
         AND t.trade_date < ?`,
      [multiplier, multiplier, userId, accountId, symbol, splitDate]
    );
  },
};

