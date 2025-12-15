import { query, queryOne, insert, execute } from './db';

// Type definitions for Balance Sheet models
export interface BSCategory {
    id: number;
    user_id: number;
    name: string;
    type: 'income' | 'expense';
    description: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface BSBank {
    id: number;
    user_id: number;
    name: string;
    ifsc_code: string | null;
    account_name: string | null;
    account_number: string | null;
    balance: number;
    created_at: Date;
    updated_at: Date;
}

export interface BSTransaction {
    id: number;
    user_id: number;
    category_id: number;
    bank_id: number;
    type: 'income' | 'expense';
    amount: number;
    transaction_date: Date;
    description: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface BSRecurring {
    id: number;
    user_id: number;
    category_id: number;
    bank_id: number;
    type: 'income' | 'expense';
    amount: number;
    description: string | null;
    created_at: Date;
    updated_at: Date;
}

// Balance Sheet Database Helper Functions
export const bsDb = {
    // Category operations
    async getCategories(userId: number, type?: 'income' | 'expense'): Promise<BSCategory[]> {
        let sql = 'SELECT * FROM bs_categories WHERE user_id = ?';
        const params: any[] = [userId];

        if (type) {
            sql += ' AND type = ?';
            params.push(type);
        }

        sql += ' ORDER BY name';
        return query<BSCategory>(sql, params);
    },

    async getCategoryById(id: number, userId: number): Promise<BSCategory | null> {
        return queryOne<BSCategory>(
            'SELECT * FROM bs_categories WHERE id = ? AND user_id = ?',
            [id, userId]
        );
    },

    async createCategory(
        userId: number,
        name: string,
        type: 'income' | 'expense',
        description?: string
    ): Promise<number> {
        return insert(
            'INSERT INTO bs_categories (user_id, name, type, description) VALUES (?, ?, ?, ?)',
            [userId, name, type, description || null]
        );
    },

    async updateCategory(
        id: number,
        userId: number,
        name: string,
        description?: string
    ): Promise<number> {
        return execute(
            'UPDATE bs_categories SET name = ?, description = ? WHERE id = ? AND user_id = ?',
            [name, description || null, id, userId]
        );
    },

    async deleteCategory(id: number, userId: number): Promise<number> {
        return execute(
            'DELETE FROM bs_categories WHERE id = ? AND user_id = ?',
            [id, userId]
        );
    },

    // Bank operations
    async getBanks(userId: number): Promise<BSBank[]> {
        return query<BSBank>(
            'SELECT * FROM bs_banks WHERE user_id = ? ORDER BY name',
            [userId]
        );
    },

    async getBankById(id: number, userId: number): Promise<BSBank | null> {
        return queryOne<BSBank>(
            'SELECT * FROM bs_banks WHERE id = ? AND user_id = ?',
            [id, userId]
        );
    },

    async createBank(
        userId: number,
        name: string,
        balance: number = 0,
        ifscCode?: string,
        accountName?: string,
        accountNumber?: string
    ): Promise<number> {
        return insert(
            'INSERT INTO bs_banks (user_id, name, balance, ifsc_code, account_name, account_number) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, name, balance, ifscCode || null, accountName || null, accountNumber || null]
        );
    },

    async updateBank(
        id: number,
        userId: number,
        name: string,
        balance: number,
        ifscCode?: string,
        accountName?: string,
        accountNumber?: string
    ): Promise<number> {
        return execute(
            'UPDATE bs_banks SET name = ?, balance = ?, ifsc_code = ?, account_name = ?, account_number = ? WHERE id = ? AND user_id = ?',
            [name, balance, ifscCode || null, accountName || null, accountNumber || null, id, userId]
        );
    },

    async deleteBank(id: number, userId: number): Promise<number> {
        return execute(
            'DELETE FROM bs_banks WHERE id = ? AND user_id = ?',
            [id, userId]
        );
    },

    // Transaction operations
    async getTransactions(
        userId: number,
        options: {
            type?: 'income' | 'expense';
            month?: number;
            year?: number;
            categoryId?: number;
            bankId?: number;
            page?: number;
            limit?: number;
        } = {}
    ): Promise<{ transactions: BSTransaction[]; total: number }> {
        const { type, month, year, categoryId, bankId, page = 1, limit = 50 } = options;

        let sql = 'SELECT * FROM bs_transactions WHERE user_id = ?';
        const params: any[] = [userId];

        if (type) {
            sql += ' AND type = ?';
            params.push(type);
        }

        if (categoryId) {
            sql += ' AND category_id = ?';
            params.push(categoryId);
        }

        if (bankId) {
            sql += ' AND bank_id = ?';
            params.push(bankId);
        }

        if (month && year) {
            sql += ' AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?';
            params.push(month, year);
        } else if (year) {
            sql += ' AND YEAR(transaction_date) = ?';
            params.push(year);
        }

        // Get total count
        const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
        const countResult = await queryOne<{ count: number }>(countSql, params);
        const total = countResult?.count || 0;

        // Add pagination
        sql += ' ORDER BY transaction_date DESC, id DESC';
        sql += ' LIMIT ? OFFSET ?';
        params.push(limit, (page - 1) * limit);

        const transactions = await query<BSTransaction>(sql, params);

        return { transactions, total };
    },

    async getTransactionById(id: number, userId: number): Promise<BSTransaction | null> {
        return queryOne<BSTransaction>(
            'SELECT * FROM bs_transactions WHERE id = ? AND user_id = ?',
            [id, userId]
        );
    },

    async createTransaction(
        userId: number,
        categoryId: number,
        bankId: number,
        type: 'income' | 'expense',
        amount: number,
        transactionDate: Date,
        description?: string
    ): Promise<number> {
        return insert(
            `INSERT INTO bs_transactions 
       (user_id, category_id, bank_id, type, amount, transaction_date, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, categoryId, bankId, type, amount, transactionDate, description || null]
        );
    },

    async checkDuplicateRecurringTransaction(
        userId: number,
        recurringId: number,
        month: number,
        year: number
    ): Promise<boolean> {
        const result = await queryOne<{ count: number }>(
            `SELECT COUNT(*) as count 
       FROM bs_transactions t
       INNER JOIN bs_recurring r ON t.category_id = r.category_id 
         AND t.bank_id = r.bank_id 
         AND t.type = r.type 
         AND t.amount = r.amount
       WHERE t.user_id = ? 
         AND r.id = ?
         AND MONTH(t.transaction_date) = ?
         AND YEAR(t.transaction_date) = ?`,
            [userId, recurringId, month, year]
        );
        return (result?.count || 0) > 0;
    },

    async updateTransaction(
        id: number,
        userId: number,
        categoryId: number,
        bankId: number,
        amount: number,
        transactionDate: Date,
        description?: string
    ): Promise<number> {
        return execute(
            `UPDATE bs_transactions 
       SET category_id = ?, bank_id = ?, amount = ?, transaction_date = ?, description = ? 
       WHERE id = ? AND user_id = ?`,
            [categoryId, bankId, amount, transactionDate, description || null, id, userId]
        );
    },

    async deleteTransaction(id: number, userId: number): Promise<number> {
        return execute(
            'DELETE FROM bs_transactions WHERE id = ? AND user_id = ?',
            [id, userId]
        );
    },

    // Recurring operations
    async getRecurring(userId: number, type?: 'income' | 'expense'): Promise<BSRecurring[]> {
        let sql = 'SELECT * FROM bs_recurring WHERE user_id = ?';
        const params: any[] = [userId];

        if (type) {
            sql += ' AND type = ?';
            params.push(type);
        }

        sql += ' ORDER BY type, id';
        return query<BSRecurring>(sql, params);
    },

    async getRecurringById(id: number, userId: number): Promise<BSRecurring | null> {
        return queryOne<BSRecurring>(
            'SELECT * FROM bs_recurring WHERE id = ? AND user_id = ?',
            [id, userId]
        );
    },

    async createRecurring(
        userId: number,
        categoryId: number,
        bankId: number,
        type: 'income' | 'expense',
        amount: number,
        description?: string
    ): Promise<number> {
        return insert(
            `INSERT INTO bs_recurring 
       (user_id, category_id, bank_id, type, amount, description) 
       VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, categoryId, bankId, type, amount, description || null]
        );
    },

    async updateRecurring(
        id: number,
        userId: number,
        categoryId: number,
        bankId: number,
        amount: number,
        description?: string
    ): Promise<number> {
        return execute(
            `UPDATE bs_recurring 
       SET category_id = ?, bank_id = ?, amount = ?, description = ? 
       WHERE id = ? AND user_id = ?`,
            [categoryId, bankId, amount, description || null, id, userId]
        );
    },

    async deleteRecurring(id: number, userId: number): Promise<number> {
        return execute(
            'DELETE FROM bs_recurring WHERE id = ? AND user_id = ?',
            [id, userId]
        );
    },

    // Get upcoming recurring transactions (not yet added for current/future months)
    async getUpcomingRecurring(
        userId: number,
        monthsAhead: number = 3
    ): Promise<Array<{
        recurring: BSRecurring;
        category_name: string;
        bank_name: string;
        next_month: number;
        next_year: number;
        already_added: boolean;
    }>> {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const recurring = await bsDb.getRecurring(userId);
        const upcoming: Array<{
            recurring: BSRecurring;
            category_name: string;
            bank_name: string;
            next_month: number;
            next_year: number;
            already_added: boolean;
        }> = [];

        for (const rec of recurring) {
            for (let i = 0; i < monthsAhead; i++) {
                const month = ((currentMonth + i - 1) % 12) + 1;
                const year = currentYear + Math.floor((currentMonth + i - 1) / 12);

                const alreadyAdded = await bsDb.checkDuplicateRecurringTransaction(
                    userId,
                    rec.id,
                    month,
                    year
                );

                const category = await bsDb.getCategoryById(rec.category_id, userId);
                const bank = await bsDb.getBankById(rec.bank_id, userId);

                upcoming.push({
                    recurring: rec,
                    category_name: category?.name || 'Unknown',
                    bank_name: bank?.name || 'Unknown',
                    next_month: month,
                    next_year: year,
                    already_added: alreadyAdded,
                });
            }
        }

        return upcoming.filter(u => !u.already_added);
    },

    // Get bank balance projections for current month
    async getBankBalanceProjections(
        userId: number,
        month?: number,
        year?: number
    ): Promise<Array<{
        bank_id: number;
        bank_name: string;
        current_balance: number;
        current_month_income: number;
        current_month_expense: number;
        projected_end_balance: number;
        recurring_income: number;
        recurring_expense: number;
    }>> {
        const now = new Date();
        const currentMonth = month || now.getMonth() + 1;
        const currentYear = year || now.getFullYear();

        const banks = await bsDb.getBanks(userId);
        const projections: Array<{
            bank_id: number;
            bank_name: string;
            current_balance: number;
            current_month_income: number;
            current_month_expense: number;
            projected_end_balance: number;
            recurring_income: number;
            recurring_expense: number;
        }> = [];

        for (const bank of banks) {
            // Get current month transactions
            const monthTransactions = await bsDb.getTransactions(userId, {
                bankId: bank.id,
                month: currentMonth,
                year: currentYear,
            });

            const currentMonthIncome = monthTransactions.transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const currentMonthExpense = monthTransactions.transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            // Get recurring transactions for this bank
            const recurring = await bsDb.getRecurring(userId);
            const bankRecurring = recurring.filter(r => r.bank_id === bank.id);

            const recurringIncome = bankRecurring
                .filter(r => r.type === 'income')
                .reduce((sum, r) => sum + r.amount, 0);

            const recurringExpense = bankRecurring
                .filter(r => r.type === 'expense')
                .reduce((sum, r) => sum + r.amount, 0);

            // Calculate projected end balance
            const projectedEndBalance = bank.balance
                + currentMonthIncome
                - currentMonthExpense
                + recurringIncome
                - recurringExpense;

            projections.push({
                bank_id: bank.id,
                bank_name: bank.name,
                current_balance: bank.balance,
                current_month_income: currentMonthIncome,
                current_month_expense: currentMonthExpense,
                projected_end_balance: projectedEndBalance,
                recurring_income: recurringIncome,
                recurring_expense: recurringExpense,
            });
        }

        return projections;
    },

    // Statistics operations
    async getStats(
        userId: number,
        options: {
            month?: number;
            year?: number;
        } = {}
    ): Promise<{
        totalIncome: number;
        totalExpense: number;
        incomeByCategory: Array<{ category_id: number; category_name: string; total: number }>;
        expenseByCategory: Array<{ category_id: number; category_name: string; total: number }>;
        incomeByAccount: Array<{ bank_id: number; bank_name: string; total: number }>;
        expenseByAccount: Array<{ bank_id: number; bank_name: string; total: number }>;
    }> {
        const { month, year } = options;

        let dateFilter = '';
        const params: any[] = [userId];

        if (month && year) {
            dateFilter = ' AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?';
            params.push(month, year);
        } else if (year) {
            dateFilter = ' AND YEAR(transaction_date) = ?';
            params.push(year);
        }

        // Total income and expense
        const totals = await queryOne<{ total_income: number; total_expense: number }>(
            `SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
       FROM bs_transactions 
       WHERE user_id = ? ${dateFilter}`,
            params
        );

        // Income by category
        const incomeByCategory = await query<{ category_id: number; category_name: string; total: number }>(
            `SELECT 
        t.category_id,
        c.name as category_name,
        SUM(t.amount) as total
       FROM bs_transactions t
       INNER JOIN bs_categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.type = 'income' ${dateFilter}
       GROUP BY t.category_id, c.name
       ORDER BY total DESC`,
            params
        );

        // Expense by category
        const expenseByCategory = await query<{ category_id: number; category_name: string; total: number }>(
            `SELECT 
        t.category_id,
        c.name as category_name,
        SUM(t.amount) as total
       FROM bs_transactions t
       INNER JOIN bs_categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.type = 'expense' ${dateFilter}
       GROUP BY t.category_id, c.name
       ORDER BY total DESC`,
            params
        );

        // Income by account
        const incomeByAccount = await query<{ bank_id: number; bank_name: string; total: number }>(
            `SELECT 
        t.bank_id,
        b.name as bank_name,
        SUM(t.amount) as total
       FROM bs_transactions t
       INNER JOIN bs_banks b ON t.bank_id = b.id
       WHERE t.user_id = ? AND t.type = 'income' ${dateFilter}
       GROUP BY t.bank_id, b.name
       ORDER BY total DESC`,
            params
        );

        // Expense by account
        const expenseByAccount = await query<{ bank_id: number; bank_name: string; total: number }>(
            `SELECT 
        t.bank_id,
        b.name as bank_name,
        SUM(t.amount) as total
       FROM bs_transactions t
       INNER JOIN bs_banks b ON t.bank_id = b.id
       WHERE t.user_id = ? AND t.type = 'expense' ${dateFilter}
       GROUP BY t.bank_id, b.name
       ORDER BY total DESC`,
            params
        );

        return {
            totalIncome: totals?.total_income || 0,
            totalExpense: totals?.total_expense || 0,
            incomeByCategory: incomeByCategory || [],
            expenseByCategory: expenseByCategory || [],
            incomeByAccount: incomeByAccount || [],
            expenseByAccount: expenseByAccount || [],
        };
    },
};

