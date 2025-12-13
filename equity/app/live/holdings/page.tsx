'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Filter, TrendingUp, TrendingDown } from 'lucide-react';

interface Account {
  id: string;
  name: string;
}

interface Holding {
  tradingsymbol: string;
  exchange: string;
  isin: string;
  quantity: number;
  average_price: number;
  last_price: number;
  pnl: number;
  day_change: number;
  day_change_percentage: number;
}

interface MFHolding {
  tradingsymbol: string;
  folio: string;
  fund: string;
  quantity: number;
  average_price: number;
  last_price: number;
  pnl: number;
}

interface AccountHoldings {
  accountId: string;
  accountName: string;
  holdings: Holding[];
  mfHoldings: MFHolding[];
  authenticated: boolean;
  error?: string;
}

export default function LiveHoldingsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('consolidated');
  const [accountsData, setAccountsData] = useState<AccountHoldings[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      loadHoldings();
    }
  }, [accounts]);

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/kite/accounts');
      const data = await response.json();
      
      if (data.accounts && data.accounts.length > 0) {
        setAccounts(data.accounts);
      } else {
        setError('No Kite accounts configured');
      }
    } catch (err) {
      setError('Failed to load accounts');
    }
  };

  const loadHoldings = async () => {
    setLoading(true);
    setError(null);

    try {
      const allAccountsData: AccountHoldings[] = [];

      for (const account of accounts) {
        try {
          // Fetch holdings
          const holdingsRes = await fetch('/api/kite/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'get_holdings',
              args: { client_id: account.id }
            })
          });
          const holdingsData = await holdingsRes.json();

          // Fetch MF holdings
          const mfRes = await fetch('/api/kite/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: 'get_mf_holdings',
              args: { client_id: account.id }
            })
          });
          const mfData = await mfRes.json();

          if (holdingsData.error) {
            allAccountsData.push({
              accountId: account.id,
              accountName: account.name,
              holdings: [],
              mfHoldings: [],
              authenticated: false,
              error: holdingsData.error,
            });
          } else {
            allAccountsData.push({
              accountId: account.id,
              accountName: account.name,
              holdings: Array.isArray(holdingsData) ? holdingsData : [],
              mfHoldings: Array.isArray(mfData) ? mfData : [],
              authenticated: true,
            });
          }
        } catch (err) {
          allAccountsData.push({
            accountId: account.id,
            accountName: account.name,
            holdings: [],
            mfHoldings: [],
            authenticated: false,
            error: 'Failed to fetch data',
          });
        }
      }

      setAccountsData(allAccountsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load holdings');
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on selected account
  const getFilteredData = () => {
    if (selectedAccount === 'consolidated') {
      return accountsData;
    } else {
      return accountsData.filter(acc => acc.accountId === selectedAccount);
    }
  };

  // Calculate consolidated summary
  const getSummary = () => {
    const filteredData = getFilteredData();
    
    let totalInvestment = 0;
    let totalCurrentValue = 0;
    let totalEquityHoldings = 0;
    let totalMFHoldings = 0;

    filteredData.forEach(account => {
      account.holdings.forEach(holding => {
        const investment = holding.quantity * holding.average_price;
        const currentValue = holding.quantity * holding.last_price;
        totalInvestment += investment;
        totalCurrentValue += currentValue;
        totalEquityHoldings++;
      });

      account.mfHoldings.forEach(mf => {
        const investment = mf.quantity * mf.average_price;
        const currentValue = mf.quantity * mf.last_price;
        totalInvestment += investment;
        totalCurrentValue += currentValue;
        totalMFHoldings++;
      });
    });

    const totalPnL = totalCurrentValue - totalInvestment;
    const totalPnLPercent = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      totalCurrentValue,
      totalPnL,
      totalPnLPercent,
      totalEquityHoldings,
      totalMFHoldings,
      authenticatedAccounts: filteredData.filter(a => a.authenticated).length,
      totalAccounts: filteredData.length,
    };
  };

  const summary = getSummary();
  const filteredData = getFilteredData();
  const hasData = filteredData.some(acc => acc.authenticated && (acc.holdings.length > 0 || acc.mfHoldings.length > 0));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Holdings</h1>
              <p className="text-gray-600">Real-time holdings from Zerodha Kite Connect API</p>
            </div>
            <button
              onClick={loadHoldings}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-300"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Account Filter */}
        {accounts.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-5 w-5 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">
                Filter by Account:
              </label>
            </div>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="consolidated">📊 All Accounts (Consolidated)</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  👤 {account.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mr-3" />
            <span className="text-gray-600">Loading holdings...</span>
          </div>
        )}

        {/* Summary Cards */}
        {!loading && hasData && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="text-sm text-gray-600">Total Investment</div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{summary.totalInvestment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
              <div className="text-sm text-gray-600">Current Value</div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{summary.totalCurrentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
              <div className="text-sm text-gray-600">Total P&L</div>
              <div className={`text-2xl font-bold ${summary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{summary.totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                <div className="text-sm">({summary.totalPnLPercent.toFixed(2)}%)</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <div className="text-sm text-gray-600">Holdings</div>
              <div className="text-2xl font-bold text-gray-900">
                {summary.totalEquityHoldings + summary.totalMFHoldings}
                <div className="text-xs text-gray-500">
                  {summary.totalEquityHoldings} Equity · {summary.totalMFHoldings} MF
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
              <div className="text-sm text-gray-600">Accounts</div>
              <div className="text-2xl font-bold text-gray-900">
                {summary.authenticatedAccounts} / {summary.totalAccounts}
                <div className="text-xs text-gray-500">Authenticated</div>
              </div>
            </div>
          </div>
        )}

        {/* No Data / Not Authenticated */}
        {!loading && !hasData && accounts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">No holdings data available</p>
            <p className="text-sm text-gray-500 mb-4">
              Make sure your accounts are authenticated
            </p>
            <button
              onClick={() => router.push('/settings/accounts')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Configure Accounts
            </button>
          </div>
        )}

        {/* Holdings by Account */}
        {!loading && hasData && filteredData.map((accountData) => (
          <div key={accountData.accountId} className="mb-8">
            {/* Account Header */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                {accountData.accountName}
                {accountData.authenticated ? (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                    ✓ Authenticated
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                    Not Authenticated
                  </span>
                )}
              </h2>
            </div>

            {/* Error for this account */}
            {accountData.error && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                {accountData.error}
              </div>
            )}

            {/* Equity Holdings */}
            {accountData.holdings.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Equity Holdings ({accountData.holdings.length})
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exchange</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">LTP</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Investment</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Value</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">P&L</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Day Change</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {accountData.holdings.map((holding, idx) => {
                        const investment = holding.quantity * holding.average_price;
                        const currentValue = holding.quantity * holding.last_price;
                        const pnlPercent = investment > 0 ? ((currentValue - investment) / investment) * 100 : 0;

                        return (
                          <tr key={`${holding.tradingsymbol}-${idx}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {holding.tradingsymbol}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {holding.exchange}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                              {holding.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                              ₹{holding.average_price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                              ₹{holding.last_price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                              ₹{investment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                              ₹{currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {holding.pnl >= 0 ? '+' : ''}₹{holding.pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              <div className="text-xs">
                                ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                              </div>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${holding.day_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              <div className="flex items-center justify-end gap-1">
                                {holding.day_change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {holding.day_change >= 0 ? '+' : ''}{holding.day_change_percentage.toFixed(2)}%
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MF Holdings */}
            {accountData.mfHoldings.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Mutual Fund Holdings ({accountData.mfHoldings.length})
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fund</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">NAV</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Investment</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Value</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">P&L</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {accountData.mfHoldings.map((mf, idx) => {
                        const investment = mf.quantity * mf.average_price;
                        const currentValue = mf.quantity * mf.last_price;
                        const pnlPercent = investment > 0 ? ((currentValue - investment) / investment) * 100 : 0;

                        return (
                          <tr key={`${mf.folio}-${idx}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {mf.fund}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {mf.folio}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                              {mf.quantity.toFixed(3)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                              ₹{mf.average_price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                              ₹{mf.last_price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                              ₹{investment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                              ₹{currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${mf.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {mf.pnl >= 0 ? '+' : ''}₹{mf.pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              <div className="text-xs">
                                ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No holdings for this account */}
            {accountData.authenticated && accountData.holdings.length === 0 && accountData.mfHoldings.length === 0 && (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No holdings found for this account
              </div>
            )}
          </div>
        ))}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <a
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 hover:underline"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

