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
export interface Account {
  id: number;
  name: string;
  broker_id: string | null;
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
  // Account queries
  async getAccounts(): Promise<Account[]> {
    return query<Account>('SELECT * FROM accounts ORDER BY name');
  },

  async getAccountById(id: number): Promise<Account | null> {
    return queryOne<Account>('SELECT * FROM accounts WHERE id = ?', [id]);
  },

  async createAccount(name: string, brokerId?: string): Promise<number> {
    return insert(
      'INSERT INTO accounts (name, broker_id) VALUES (?, ?)',
      [name, brokerId || null]
    );
  },

  async updateAccount(id: number, name: string, brokerId?: string): Promise<number> {
    return execute(
      'UPDATE accounts SET name = ?, broker_id = ? WHERE id = ?',
      [name, brokerId || null, id]
    );
  },

  async deleteAccount(id: number): Promise<number> {
    return execute('DELETE FROM accounts WHERE id = ?', [id]);
  },

  // Trade queries
  async getTrades(accountId?: number, symbol?: string): Promise<Trade[]> {
    let sql = 'SELECT * FROM trades WHERE 1=1';
    const params: any[] = [];

    if (accountId) {
      sql += ' AND account_id = ?';
      params.push(accountId);
    }

    if (symbol) {
      sql += ' AND symbol = ?';
      params.push(symbol);
    }

    sql += ' ORDER BY trade_date DESC';

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

  // Ledger queries
  async getLedger(accountId?: number): Promise<Ledger[]> {
    let sql = 'SELECT * FROM ledger WHERE 1=1';
    const params: any[] = [];

    if (accountId) {
      sql += ' AND account_id = ?';
      params.push(accountId);
    }

    sql += ' ORDER BY posting_date DESC';

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

  // Portfolio analytics queries
  async getHoldings(accountId?: number): Promise<any[]> {
    let sql = `
      SELECT 
        symbol,
        account_id,
        SUM(CASE WHEN trade_type = 'buy' THEN quantity ELSE -quantity END) as quantity,
        SUM(CASE WHEN trade_type = 'buy' THEN quantity * price ELSE -quantity * price END) / 
          SUM(CASE WHEN trade_type = 'buy' THEN quantity ELSE -quantity END) as avg_price
      FROM trades
      WHERE 1=1
    `;
    const params: any[] = [];

    if (accountId) {
      sql += ' AND account_id = ?';
      params.push(accountId);
    }

    sql += `
      GROUP BY symbol, account_id
      HAVING quantity > 0
      ORDER BY symbol
    `;

    return query(sql, params);
  },

  async getCashFlows(accountId?: number): Promise<any[]> {
    let sql = `
      SELECT 
        posting_date as date,
        (credit - debit) as amount
      FROM ledger
      WHERE 1=1
    `;
    const params: any[] = [];

    if (accountId) {
      sql += ' AND account_id = ?';
      params.push(accountId);
    }

    sql += ' ORDER BY posting_date';

    return query(sql, params);
  },

  async getTradesForSymbol(symbol: string, accountId?: number): Promise<Trade[]> {
    let sql = 'SELECT * FROM trades WHERE symbol = ?';
    const params: any[] = [symbol];

    if (accountId) {
      sql += ' AND account_id = ?';
      params.push(accountId);
    }

    sql += ' ORDER BY trade_date';

    return query<Trade>(sql, params);
  },

  // Conflict management
  async getConflicts(accountId?: number, status?: string): Promise<ImportConflict[]> {
    let sql = 'SELECT * FROM import_conflicts WHERE 1=1';
    const params: any[] = [];

    if (accountId) {
      sql += ' AND account_id = ?';
      params.push(accountId);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

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

  async resolveConflict(id: number, status: string, resolvedBy?: string): Promise<number> {
    return execute(
      'UPDATE import_conflicts SET status = ?, resolved_at = NOW(), resolved_by = ? WHERE id = ?',
      [status, resolvedBy || 'system', id]
    );
  },

  async deleteConflict(id: number): Promise<number> {
    return execute('DELETE FROM import_conflicts WHERE id = ?', [id]);
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

  // Apply stock split
  async applyStockSplit(
    accountId: number,
    symbol: string,
    splitDate: Date,
    oldRatio: number,
    newRatio: number
  ): Promise<number> {
    const multiplier = newRatio / oldRatio;
    return execute(
      `UPDATE trades 
       SET quantity = quantity * ?, 
           price = price / ?
       WHERE account_id = ? 
         AND symbol = ? 
         AND trade_date < ?`,
      [multiplier, multiplier, accountId, symbol, splitDate]
    );
  },
};

