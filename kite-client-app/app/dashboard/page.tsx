'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Wallet, PieChart, Users, Eye, EyeOff, RefreshCw, Zap, Database } from 'lucide-react';
import { useKiteStore } from '@/store/useKiteStore';

interface Account {
  id: number;
  name: string;
}

interface ManualStats {
  accountId: string | number;
  accountName: string;
  totalInvestment: number;
  totalInvestedFromLedger: number;
  currentValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  xirr: number | null;
  holdingsCount: number;
  activeHoldingsCount: number;
  holdings: ManualHolding[];
}

interface ManualHolding {
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
  // Manual CSV Data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('consolidated');
  const [manualStats, setManualStats] = useState<ManualStats | null>(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  
  // Live Zerodha Data
  const { 
    consolidated: liveData,
    fetchAllAccountsData,  
    isLoading: liveLoading,
    availableAccounts: liveAccounts,
    accounts: accountsData,
    isDataHidden,
    toggleDataVisibility
  } = useKiteStore();
  
  const router = useRouter();

  useEffect(() => {
    fetchManualAccounts();
    fetchLiveData();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchManualStats();
    }
  }, [selectedAccount]);

  const fetchManualAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      
      if (data.success) {
        setAccounts(data.accounts);
      }
    } catch (err) {
      console.error('Failed to fetch manual accounts:', err);
    }
  };

  const fetchLiveData = async () => {
    try {
      await fetchAllAccountsData();
    } catch (err) {
      console.error('Failed to fetch live data:', err);
    }
  };

  const fetchManualStats = async () => {
    setManualLoading(true);
    setManualError(null);
    
    try {
      const url = selectedAccount === 'consolidated' 
        ? '/api/stats'
        : `/api/stats?accountId=${selectedAccount}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setManualStats(data.stats);
      } else {
        setManualError(data.error);
      }
    } catch (err: any) {
      setManualError('Failed to fetch manual portfolio stats');
    } finally {
      setManualLoading(false);
    }
  };

  const maskData = (value: number) => {
    return isDataHidden ? '****' : `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const maskPercent = (value: number) => {
    return isDataHidden ? '**%' : `${value.toFixed(2)}%`;
  };

  // Check if we have any data
  const hasLiveData = liveData.holdings.length > 0 || liveData.mfHoldings.length > 0;
  const hasManualData = manualStats && manualStats.holdings.length > 0;

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
                onClick={toggleDataVisibility}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
                title={isDataHidden ? "Show Data" : "Hide Data"}
              >
                {isDataHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{isDataHidden ? 'Show' : 'Hide'}</span>
              </button>
              <button
                onClick={() => {
                  fetchManualStats();
                  fetchLiveData();
                }}
                disabled={manualLoading || liveLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium disabled:bg-gray-300"
              >
                <RefreshCw className={`h-4 w-4 ${(manualLoading || liveLoading) ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        {/* Account Switcher for Manual Data */}
        {accounts.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manual Portfolio View:
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
        )}

        {/* SECTION 1: LIVE TRADING DATA (Zerodha API) */}
        <div className="mb-8 pb-8 border-b-4 border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Live Trading (Zerodha API)</h2>
            <span className={`text-xs px-3 py-1 rounded-full ${hasLiveData ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              {liveLoading ? '⏳ Loading...' : hasLiveData ? '🟢 Connected' : '🔴 No Data'}
            </span>
          </div>

          {liveLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">Loading live data...</div>
            </div>
          ) : hasLiveData ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <div className="bg-white overflow-hidden shadow rounded-lg p-5 border-l-4 border-green-500">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                      <Wallet className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Investment
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {maskData(liveData.totalInvestment)}
                      </dd>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg p-5 border-l-4 border-blue-500">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                      <PieChart className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Current Value
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {maskData(liveData.totalValue)}
                      </dd>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg p-5 border-l-4 border-purple-500">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-md p-3 ${liveData.totalPnL >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <TrendingUp className={`h-6 w-6 ${liveData.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total P&L
                      </dt>
                      <dd className={`text-lg font-medium ${liveData.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {maskData(liveData.totalPnL)}
                        <span className="text-sm ml-2">
                          ({maskPercent(liveData.totalPnLPercentage)})
                        </span>
                      </dd>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg p-5 border-l-4 border-indigo-500">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                      <Users className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Holdings
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {liveData.holdings.length + liveData.mfHoldings.length}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Showing live data from {liveAccounts.length} Zerodha account(s). 
                <a href="/live/holdings" className="ml-2 text-blue-600 hover:underline">
                  View detailed holdings →
                </a>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 mb-4">No live trading data available</p>
              <p className="text-sm text-gray-500 mb-4">
                Configure Zerodha Kite Connect API to see live holdings and positions
              </p>
              <button
                onClick={() => router.push('/settings/accounts')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Configure API Access
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2: MANUAL PORTFOLIO ANALYTICS (CSV Data) */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Portfolio Analytics (CSV Data)</h2>
            <span className={`text-xs px-3 py-1 rounded-full ${hasManualData ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
              {manualLoading ? '⏳ Loading...' : hasManualData ? '📊 Data Available' : '📭 No Data'}
            </span>
          </div>

          {manualError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {manualError}
            </div>
          )}

          {manualLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">Loading manual portfolio data...</div>
            </div>
          ) : manualStats && hasManualData ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <div className="bg-white overflow-hidden shadow rounded-lg p-5 border-l-4 border-blue-500">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                      <Wallet className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Investment
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {maskData(manualStats.totalInvestment)}
                      </dd>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg p-5 border-l-4 border-purple-500">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                      <PieChart className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Current Value
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {maskData(manualStats.currentValue)}
                      </dd>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg p-5 border-l-4 border-orange-500">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-md p-3 ${manualStats.totalPnl >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <TrendingUp className={`h-6 w-6 ${manualStats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total P&L
                      </dt>
                      <dd className={`text-lg font-medium ${manualStats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {maskData(manualStats.totalPnl)}
                        <span className="text-sm ml-2">
                          ({maskPercent(manualStats.totalPnlPercent)})
                        </span>
                      </dd>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg p-5 border-l-4 border-indigo-500">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                      <Users className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        XIRR
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {manualStats.xirr !== null ? maskPercent(manualStats.xirr) : 'N/A'}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                Showing analytics from CSV imports. {manualStats.holdingsCount} total stocks tracked ({manualStats.activeHoldingsCount} active, {manualStats.holdingsCount - manualStats.activeHoldingsCount} closed).
                <br />
                <span className="text-green-600">Realized P&L: ₹{manualStats.totalRealizedPnL.toLocaleString('en-IN')}</span> | 
                <span className="text-blue-600 ml-2">Unrealized P&L: ₹{manualStats.totalUnrealizedPnL.toLocaleString('en-IN')}</span>
                <a href="/holdings" className="ml-2 text-blue-600 hover:underline">
                  → View detailed analytics
                </a>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 mb-4">No manual portfolio data available</p>
              <p className="text-sm text-gray-500 mb-4">
                Import your Tradebook and Ledger CSV files to track historical performance and XIRR
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => router.push('/settings/accounts')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button 
            onClick={() => router.push('/import')}
            className="block p-6 bg-white shadow rounded-lg hover:bg-gray-50 transition text-left"
          >
            <h3 className="text-lg font-medium text-gray-900">
              📥 Import Data
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Upload tradebook and ledger CSV files
            </p>
          </button>
          <button 
            onClick={() => router.push('/conflicts')}
            className="block p-6 bg-white shadow rounded-lg hover:bg-gray-50 transition text-left"
          >
            <h3 className="text-lg font-medium text-gray-900">
              ⚠️ Resolve Conflicts
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Review and resolve import conflicts
            </p>
          </button>
          <button 
            onClick={() => router.push('/tools')}
            className="block p-6 bg-white shadow rounded-lg hover:bg-gray-50 transition text-left"
          >
            <h3 className="text-lg font-medium text-gray-900">
              🔧 Portfolio Tools
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Apply stock splits and manage data
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}
