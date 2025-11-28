/**
 * Configuration helper to load multiple Kite accounts from environment variables
 */

export interface KiteAccountConfig {
    id: string;       // Unique identifier (e.g., "father", "mother")
    name: string;     // Display name for UI
    apiKey: string;
    apiSecret: string;
}

/**
 * Loads all Kite accounts from environment variables
 * Expected format:
 * KITE_ACC_1_ID=father
 * KITE_ACC_1_NAME=Dad's Portfolio
 * KITE_ACC_1_KEY=xxx
 * KITE_ACC_1_SECRET=yyy
 */
export function loadAccountsConfig(): KiteAccountConfig[] {
    const accounts: KiteAccountConfig[] = [];
    let index = 1;

    while (true) {
        const id = process.env[`KITE_ACC_${index}_ID`];
        const name = process.env[`KITE_ACC_${index}_NAME`];
        const apiKey = process.env[`KITE_ACC_${index}_KEY`];
        const apiSecret = process.env[`KITE_ACC_${index}_SECRET`];

        // Stop when we don't find a complete account definition
        if (!id || !apiKey || !apiSecret) {
            break;
        }

        accounts.push({
            id,
            name: name || id, // Use id as fallback name
            apiKey,
            apiSecret,
        });

        index++;
    }

    return accounts;
}

/**
 * Get a specific account config by ID
 */
export function getAccountConfig(accountId: string): KiteAccountConfig | undefined {
    const accounts = loadAccountsConfig();
    return accounts.find(acc => acc.id === accountId);
}

/**
 * Get list of account IDs and names (safe to expose to frontend)
 */
export function getAccountsList(): Array<{ id: string; name: string }> {
    const accounts = loadAccountsConfig();
    return accounts.map(acc => ({ id: acc.id, name: acc.name }));
}

