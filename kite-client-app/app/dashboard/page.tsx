'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Wallet, PieChart, Users, Eye, EyeOff, RefreshCw } from 'lucide-react';

interface Account {
  id: number;
  name: string;
}

interface Stats {
  accountId: string | number;
  accountName: string;
  totalInvestment: number;
  totalInvestedFromLedger: number;
  currentValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  xirr: number | null;
  holdingsCount: number;
  holdings: Holding[];
}

interface Holding {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  investment: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  xirr: number | null;
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('consolidated');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDataHidden, setIsDataHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchStats();
    }
  }, [selectedAccount]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      
      if (data.success) {
        setAccounts(data.accounts);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = selectedAccount === 'consolidated' 
        ? '/api/stats'
        : `/api/stats?accountId=${selectedAccount}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Failed to fetch portfolio stats');
    } finally {
      setLoading(false);
    }
  };

  const maskData = (value: number) => {
    return isDataHidden ? '****' : `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const maskPercent = (value: number) => {
    return isDataHidden ? '**%' : `${value.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Portfolio Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDataHidden(!isDataHidden)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
                title={isDataHidden ? "Show Data" : "Hide Data"}
              >
                {isDataHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{isDataHidden ? 'Show' : 'Hide'}</span>
              </button>
              <button
                onClick={fetchStats}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium disabled:bg-gray-300"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        {/* Account Switcher */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            View Portfolio For:
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="consolidated">📊 Consolidated (All Accounts)</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                👤 {account.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading portfolio data...</div>
          </div>
        ) : stats ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <Wallet className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Investment
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {maskData(stats.totalInvestment)}
                    </dd>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                    <PieChart className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Current Value
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {maskData(stats.currentValue)}
                    </dd>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-md p-3 ${stats.totalPnl >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <TrendingUp className={`h-6 w-6 ${stats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total P&L
                    </dt>
                    <dd className={`text-lg font-medium ${stats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {maskData(stats.totalPnl)}
                      <span className="text-sm ml-2">
                        ({maskPercent(stats.totalPnlPercent)})
                      </span>
                    </dd>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                    <Users className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      XIRR
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.xirr !== null ? maskPercent(stats.xirr) : 'N/A'}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Holdings Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Holdings ({stats.holdingsCount})
                </h2>
              </div>
              
              {stats.holdings.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No holdings found. Import your tradebook data to see holdings.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Symbol
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Price
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Price
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Investment
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Value
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          P&L
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          XIRR
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.holdings.map((holding) => (
                        <tr key={holding.symbol} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {holding.symbol}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            {holding.quantity.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            {maskData(holding.avgPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            {maskData(holding.currentPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            {maskData(holding.investment)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            {maskData(holding.currentValue)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {maskData(holding.pnl)}
                            <br />
                            <span className="text-xs">
                              ({maskPercent(holding.pnlPercent)})
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            {holding.xirr !== null ? maskPercent(holding.xirr) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <button 
                onClick={() => router.push('/settings/accounts')}
                className="block p-6 bg-white shadow rounded-lg hover:bg-gray-50 transition"
              >
                <h3 className="text-lg font-medium text-gray-900">
                  Manage Accounts
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Add, edit, or remove trading accounts
                </p>
              </button>
              <button 
                onClick={() => router.push('/import')}
                className="block p-6 bg-white shadow rounded-lg hover:bg-gray-50 transition"
              >
                <h3 className="text-lg font-medium text-gray-900">
                  Import Data
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Upload tradebook and ledger CSV files
                </p>
              </button>
              <button 
                onClick={() => router.push('/holdings')}
                className="block p-6 bg-white shadow rounded-lg hover:bg-gray-50 transition"
              >
                <h3 className="text-lg font-medium text-gray-900">
                  View Holdings
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Detailed holdings and positions
                </p>
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No data available</p>
            <button
              onClick={() => router.push('/settings/accounts')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
            >
              Add Accounts
            </button>
            <button
              onClick={() => router.push('/import')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Import Data
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
