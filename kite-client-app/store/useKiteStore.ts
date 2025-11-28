import { create } from 'zustand';

export interface UserProfile {
  user_id: string;
  user_name: string;
  user_shortname: string;
  email: string;
  broker: string;
  products: string[];
  order_types: string[];
}

export interface Holding {
  tradingsymbol: string;
  exchange: string;
  instrument_token: number;
  quantity: number;
  realised_quantity: number;
  t1_quantity: number;
  average_price: number;
  last_price: number;
  pnl: number;
  day_change: number;
  day_change_percentage: number;
}

export interface MFHolding {
  folio: string;
  fund: string;
  tradingsymbol: string;
  average_price: number;
  last_price: number;
  quantity: number;
  pnl: number;
}

export interface Position {
  tradingsymbol: string;
  exchange: string;
  instrument_token: number;
  product: string;
  quantity: number;
  overnight_quantity: number;
  multiplier: number;
  average_price: number;
  close_price: number;
  last_price: number;
  value: number;
  pnl: number;
  m2m: number;
  unrealised: number;
  realised: number;
}

export interface Margins {
  equity: {
    available: {
      cash: number;
      intraday_payin: number;
    };
    utilised: {
      debits: number;
      span: number;
    };
    net: number;
  };
  commodity: any;
}

export interface AccountData {
  id: string;
  name: string;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  holdings: Holding[];
  mfHoldings: MFHolding[];
  positions: { net: Position[]; day: Position[] };
  margins: Margins | null;
}

export interface ConsolidatedHolding {
  tradingsymbol: string;
  exchange: string;
  totalQuantity: number;
  averagePrice: number; // Weighted average
  currentPrice: number;
  currentValue: number;
  investmentValue: number;
  pnl: number;
  pnlPercentage: number;
  accounts: Array<{
    id: string;
    name: string;
    quantity: number;
    averagePrice: number;
    pnl: number;
  }>;
}

export interface ConsolidatedMFHolding {
  tradingsymbol: string;
  fund: string;
  totalQuantity: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  investmentValue: number;
  pnl: number;
  pnlPercentage: number;
  accounts: Array<{
    id: string;
    name: string;
    quantity: number;
    averagePrice: number;
    pnl: number;
  }>;
}

interface KiteState {
  // Available accounts from config
  availableAccounts: Array<{ id: string; name: string }>;

  // Per-account data
  accounts: Record<string, AccountData>;

  // Consolidated view
  consolidated: {
    holdings: ConsolidatedHolding[];
    mfHoldings: ConsolidatedMFHolding[];
    totalValue: number;
    totalInvestment: number;
    totalPnL: number;
    totalPnLPercentage: number;
  };

  // UI state
  isLoading: boolean;
  error: string | null;
  isDataHidden: boolean;
 
  // Actions
  setAvailableAccounts: (accounts: Array<{ id: string; name: string }>) => void;
  setAccountData: (accountId: string, data: Partial<AccountData>) => void;
  setLoading: (status: boolean) => void;
  setError: (error: string | null) => void;
  toggleDataVisibility: () => void;
 
  fetchAccounts: () => Promise<void>;
  fetchAccountData: (accountId: string) => Promise<void>;
  fetchAllAccountsData: () => Promise<void>;
  calculateConsolidated: () => void;
}

// Helper function to calculate P/L
function calculatePnL(quantity: number, avgPrice: number, lastPrice: number) {
  const investmentValue = quantity * avgPrice;
  const currentValue = quantity * lastPrice;
  const pnl = currentValue - investmentValue;
  const pnlPercentage = investmentValue > 0 ? (pnl / investmentValue) * 100 : 0;
  return { investmentValue, currentValue, pnl, pnlPercentage };
}

export const useKiteStore = create<KiteState>((set, get) => ({
  availableAccounts: [],
  accounts: {},
  consolidated: {
    holdings: [],
    mfHoldings: [],
    totalValue: 0,
    totalInvestment: 0,
    totalPnL: 0,
    totalPnLPercentage: 0,
  },
  isLoading: false,
  error: null,
  isDataHidden: false,
 
  setAvailableAccounts: (accounts) => set({ availableAccounts: accounts }),

  setAccountData: (accountId, data) => {
    const state = get();
    const existingAccount = state.accounts[accountId] || {
      id: accountId,
      name: accountId,
      isAuthenticated: false,
      profile: null,
      holdings: [],
      mfHoldings: [],
      positions: { net: [], day: [] },
      margins: null,
    };

    set({
      accounts: {
        ...state.accounts,
        [accountId]: { ...existingAccount, ...data },
      },
    });
  },

  setLoading: (status) => set({ isLoading: status }),
  setError: (error) => set({ error }),
  toggleDataVisibility: () => set((state) => ({ isDataHidden: !state.isDataHidden })),
 
  fetchAccounts: async () => {
    try {
      const res = await fetch('/api/kite/accounts');
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      set({ availableAccounts: data.accounts || [] });
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
      set({ error: error.message });
    }
  },

  fetchAccountData: async (accountId: string) => {
    const state = get();
    const accountInfo = state.availableAccounts.find(a => a.id === accountId);

    try {
      // Fetch Profile
      const profileRes = await fetch('/api/kite/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'get_profile', args: { client_id: accountId } }),
      });
      const profile = await profileRes.json();

      // Fetch Holdings
      const holdingsRes = await fetch('/api/kite/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'get_holdings', args: { client_id: accountId } }),
      });
      const holdings = await holdingsRes.json();

      // Fetch MF Holdings
      const mfHoldingsRes = await fetch('/api/kite/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'get_mf_holdings', args: { client_id: accountId } }),
      });
      const mfHoldings = await mfHoldingsRes.json();

      // Fetch Positions
      const positionsRes = await fetch('/api/kite/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'get_positions', args: { client_id: accountId } }),
      });
      const positions = await positionsRes.json();

      // Fetch Margins
      const marginsRes = await fetch('/api/kite/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'get_margins', args: { client_id: accountId } }),
      });
      const margins = await marginsRes.json();

      get().setAccountData(accountId, {
        id: accountId,
        name: accountInfo?.name || accountId,
        isAuthenticated: true,
        profile,
        holdings: Array.isArray(holdings) ? holdings : [],
        mfHoldings: Array.isArray(mfHoldings) ? mfHoldings : [],
        positions: positions || { net: [], day: [] },
        margins,
      });
    } catch (error: any) {
      console.error(`Failed to fetch data for account ${accountId}:`, error);
      throw error;
    }
  },

  fetchAllAccountsData: async () => {
    set({ isLoading: true, error: null });

    try {
      const state = get();

      // Fetch list of accounts if not already loaded
      if (state.availableAccounts.length === 0) {
        await get().fetchAccounts();
      }

      const updatedState = get();

      // Fetch data for each account
      const promises = updatedState.availableAccounts.map(account =>
        get().fetchAccountData(account.id).catch(err => {
          console.error(`Failed to fetch ${account.id}:`, err);
          return null; // Continue even if one fails
        })
      );

      await Promise.all(promises);

      // Calculate consolidated view
      get().calculateConsolidated();
    } catch (error: any) {
      console.error('Failed to fetch all accounts data:', error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  calculateConsolidated: () => {
    const state = get();
    const holdingsMap = new Map<string, ConsolidatedHolding>();
    const mfHoldingsMap = new Map<string, ConsolidatedMFHolding>();

    // Consolidate equity holdings
    Object.values(state.accounts).forEach(account => {
      account.holdings.forEach(holding => {
        const key = `${holding.exchange}:${holding.tradingsymbol}`;

        if (!holdingsMap.has(key)) {
          holdingsMap.set(key, {
            tradingsymbol: holding.tradingsymbol,
            exchange: holding.exchange,
            totalQuantity: 0,
            averagePrice: 0,
            currentPrice: holding.last_price,
            currentValue: 0,
            investmentValue: 0,
            pnl: 0,
            pnlPercentage: 0,
            accounts: [],
          });
        }

        const consolidated = holdingsMap.get(key)!;
        const { investmentValue, currentValue, pnl } = calculatePnL(
          holding.quantity,
          holding.average_price,
          holding.last_price
        );

        consolidated.totalQuantity += holding.quantity;
        consolidated.investmentValue += investmentValue;
        consolidated.currentValue += currentValue;
        consolidated.pnl += pnl;
        consolidated.currentPrice = holding.last_price; // Use latest price

        consolidated.accounts.push({
          id: account.id,
          name: account.name,
          quantity: holding.quantity,
          averagePrice: holding.average_price,
          pnl,
        });
      });
    });

    // Calculate weighted average price and percentage for holdings
    holdingsMap.forEach(holding => {
      holding.averagePrice = holding.investmentValue / holding.totalQuantity;
      holding.pnlPercentage = holding.investmentValue > 0
        ? (holding.pnl / holding.investmentValue) * 100
        : 0;
    });

    // Consolidate MF holdings
    Object.values(state.accounts).forEach(account => {
      account.mfHoldings.forEach(mf => {
        const key = mf.tradingsymbol;

        if (!mfHoldingsMap.has(key)) {
          mfHoldingsMap.set(key, {
            tradingsymbol: mf.tradingsymbol,
            fund: mf.fund,
            totalQuantity: 0,
            averagePrice: 0,
            currentPrice: mf.last_price,
            currentValue: 0,
            investmentValue: 0,
            pnl: 0,
            pnlPercentage: 0,
            accounts: [],
          });
        }

        const consolidated = mfHoldingsMap.get(key)!;
        const { investmentValue, currentValue, pnl } = calculatePnL(
          mf.quantity,
          mf.average_price,
          mf.last_price
        );

        consolidated.totalQuantity += mf.quantity;
        consolidated.investmentValue += investmentValue;
        consolidated.currentValue += currentValue;
        consolidated.pnl += pnl;
        consolidated.currentPrice = mf.last_price;

        consolidated.accounts.push({
          id: account.id,
          name: account.name,
          quantity: mf.quantity,
          averagePrice: mf.average_price,
          pnl,
        });
      });
    });

    // Calculate weighted average price and percentage for MF holdings
    mfHoldingsMap.forEach(mf => {
      mf.averagePrice = mf.investmentValue / mf.totalQuantity;
      mf.pnlPercentage = mf.investmentValue > 0
        ? (mf.pnl / mf.investmentValue) * 100
        : 0;
    });

    const holdings = Array.from(holdingsMap.values());
    const mfHoldings = Array.from(mfHoldingsMap.values());

    const totalInvestment =
      holdings.reduce((sum, h) => sum + h.investmentValue, 0) +
      mfHoldings.reduce((sum, mf) => sum + mf.investmentValue, 0);

    const totalValue =
      holdings.reduce((sum, h) => sum + h.currentValue, 0) +
      mfHoldings.reduce((sum, mf) => sum + mf.currentValue, 0);

    const totalPnL = totalValue - totalInvestment;
    const totalPnLPercentage = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

    set({
      consolidated: {
        holdings,
        mfHoldings,
        totalValue,
        totalInvestment,
        totalPnL,
        totalPnLPercentage,
      },
    });
  },
}));
