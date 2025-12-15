'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKiteStore } from '@/store/useKiteStore';
import PageShortcuts from '@/components/PageShortcuts';
import { equityLinks } from '@/lib/links';

interface Account {
  id: number;
  name: string;
}

interface ManualHolding {
  symbol: string;
  accountId: number;
  accountName: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  investment: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  realizedPnL: number;
  unrealizedPnL: number;
  xirr: number | null;
}

interface ManualStats {
  accountId: string | number;
  accountName: string;
  totalInvestment: number;
  currentValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  xirr: number | null;
  holdings: ManualHolding[];
}

type SortField = 'symbol' | 'quantity' | 'avgPrice' | 'investment' | 'realizedPnL' | 'unrealizedPnL' | 'xirr';
type SortDirection = 'asc' | 'desc' | null;
type HoldingFilter = 'all' | 'active' | 'closed';

export default function HoldingsPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'live' | 'manual'>('live');
  
  // Manual CSV Data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('consolidated');
  const [manualStats, setManualStats] = useState<ManualStats | null>(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  
  // Filtering and Sorting state
  const [holdingFilter, setHoldingFilter] = useState<HoldingFilter>('all');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Live Zerodha Data
  const { 
    consolidated: liveData,
    fetchAllAccountsData,
    isLoading: liveLoading,
  } = useKiteStore();
  
  const router = useRouter();

  useEffect(() => {
    fetchAccounts();
    fetchLiveData();
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

  const fetchLiveData = async () => {
    try {
      await fetchAllAccountsData();
    } catch (err) {
      console.error('Failed to fetch live data:', err);
    }
  };

  const fetchStats = async () => {
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
      setManualError('Failed to fetch holdings');
    } finally {
      setManualLoading(false);
    }
  };

  // Sorting and Filtering functions
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedAndFilteredHoldings = (holdings: ManualHolding[]) => {
    // First, filter holdings
    let filtered = [...holdings];
    
    if (holdingFilter === 'active') {
      filtered = filtered.filter(h => h.quantity > 0);
    } else if (holdingFilter === 'closed') {
      filtered = filtered.filter(h => h.quantity === 0);
    }
    
    // For 'all', separate active and closed
    if (holdingFilter === 'all') {
      const active = filtered.filter(h => h.quantity > 0);
      const closed = filtered.filter(h => h.quantity === 0);
      
      // Sort each group if sorting is applied
      if (sortField && sortDirection) {
        sortHoldings(active, sortField, sortDirection);
        sortHoldings(closed, sortField, sortDirection);
      }
      
      // Return active first, then closed
      return [...active, ...closed];
    }
    
    // Apply sorting if specified
    if (sortField && sortDirection) {
      sortHoldings(filtered, sortField, sortDirection);
    }
    
    return filtered;
  };

  const sortHoldings = (holdings: ManualHolding[], field: SortField, direction: SortDirection) => {
    holdings.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;
      
      switch (field) {
        case 'symbol':
          aVal = a.symbol.toLowerCase();
          bVal = b.symbol.toLowerCase();
          break;
        case 'quantity':
          aVal = a.quantity;
          bVal = b.quantity;
          break;
        case 'avgPrice':
          aVal = a.avgPrice;
          bVal = b.avgPrice;
          break;
        case 'investment':
          aVal = a.investment;
          bVal = b.investment;
          break;
        case 'realizedPnL':
          aVal = a.realizedPnL;
          bVal = b.realizedPnL;
          break;
        case 'unrealizedPnL':
          aVal = a.unrealizedPnL;
          bVal = b.unrealizedPnL;
          break;
        case 'xirr':
          aVal = a.xirr ?? -Infinity;
          bVal = b.xirr ?? -Infinity;
          break;
      }
      
      if (direction === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <span className="ml-1 text-gray-400">⇅</span>;
    }
    if (sortDirection === 'asc') {
      return <span className="ml-1 text-blue-600">↑</span>;
    }
    if (sortDirection === 'desc') {
      return <span className="ml-1 text-blue-600">↓</span>;
    }
    return <span className="ml-1 text-gray-400">⇅</span>;
  };

  const hasLiveData = liveData.holdings.length > 0 || liveData.mfHoldings.length > 0;
  const hasManualData = manualStats && manualStats.holdings.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageShortcuts links={equityLinks} title="Equity" />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Holdings</h1>
          <p className="text-gray-700">View your current stock holdings from both live and manual sources</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 bg-white rounded-lg shadow">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('live')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'live'
                  ? 'border-b-2 border-green-500 text-green-600 bg-green-50'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">🚀</span>
                <span>Live Holdings (Zerodha API)</span>
                {hasLiveData && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  {liveData.holdings.length + liveData.mfHoldings.length}
                </span>}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">📊</span>
                <span>Analytics (CSV Data)</span>
                {hasManualData && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {manualStats.holdings.length}
                </span>}
              </div>
            </button>
          </div>
        </div>

        {/* LIVE TAB */}
        {activeTab === 'live' && (
          <div>
            {liveLoading ? (
              <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow">
                <div className="text-gray-700">Loading live holdings...</div>
              </div>
            ) : hasLiveData ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                    <div className="text-sm text-gray-700">Total Investment</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ₹{liveData.totalInvestment.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                    <div className="text-sm text-gray-700">Current Value</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ₹{liveData.totalValue.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                    <div className="text-sm text-gray-700">Total P&L</div>
                    <div className={`text-2xl font-bold ${liveData.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{liveData.totalPnL.toLocaleString('en-IN')}
                      <span className="text-sm ml-2">
                        ({liveData.totalPnLPercentage.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
                    <div className="text-sm text-gray-700">Holdings</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {liveData.holdings.length + liveData.mfHoldings.length}
                    </div>
                  </div>
                </div>

                {/* Equity Holdings Table */}
                {liveData.holdings.length > 0 && (
                  <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                    <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Equity Holdings ({liveData.holdings.length})
                      </h2>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exchange</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">LTP</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Investment</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Value</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">P&L</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {liveData.holdings.map((holding) => (
                            <tr key={`${holding.exchange}:${holding.tradingsymbol}`} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {holding.tradingsymbol}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {holding.exchange}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                {holding.totalQuantity.toLocaleString('en-IN')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                ₹{holding.averagePrice.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                ₹{holding.currentPrice.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                ₹{holding.investmentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                ₹{holding.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{holding.pnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                <br />
                                <span className="text-xs">
                                  ({holding.pnlPercentage.toFixed(2)}%)
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* MF Holdings Table */}
                {liveData.mfHoldings.length > 0 && (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Mutual Fund Holdings ({liveData.mfHoldings.length})
                      </h2>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fund</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">NAV</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Investment</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Value</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">P&L</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {liveData.mfHoldings.map((mf) => (
                            <tr key={mf.tradingsymbol} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {mf.fund}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                {mf.totalQuantity.toFixed(3)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                ₹{mf.averagePrice.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                ₹{mf.currentPrice.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                ₹{mf.investmentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                ₹{mf.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${mf.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{mf.pnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                <br />
                                <span className="text-xs">
                                  ({mf.pnlPercentage.toFixed(2)}%)
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-700 mb-4">No live holdings data available</p>
                <p className="text-sm text-gray-700 mb-4">
                  Configure and connect to Zerodha Kite API to see real-time holdings
                </p>
                <button
                  onClick={fetchLiveData}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Try Loading Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* MANUAL TAB */}
        {activeTab === 'manual' && (
          <div>
            {/* Account Switcher for Manual Data */}
            {accounts.length > 0 && (
              <div className="mb-6 bg-white rounded-lg shadow p-4">
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  View Holdings For:
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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

            {/* Filter Buttons */}
            {manualStats && hasManualData && (
              <div className="mb-6 bg-white rounded-lg shadow p-4">
                <label className="block text-sm font-medium text-gray-800 mb-3">
                  Filter Holdings:
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setHoldingFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      holdingFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All ({manualStats.holdings.length})
                  </button>
                  <button
                    onClick={() => setHoldingFilter('active')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      holdingFilter === 'active'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Active ({manualStats.holdings.filter(h => h.quantity > 0).length})
                  </button>
                  <button
                    onClick={() => setHoldingFilter('closed')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      holdingFilter === 'closed'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Closed ({manualStats.holdings.filter(h => h.quantity === 0).length})
                  </button>
                </div>
              </div>
            )}

            {manualError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {manualError}
              </div>
            )}

            {manualLoading ? (
              <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow">
                <div className="text-gray-700">Loading manual holdings...</div>
              </div>
            ) : manualStats && hasManualData ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                    <div className="text-sm text-gray-700">Total Investment</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ₹{manualStats.totalInvestment.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Cost basis of current holdings</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                    <div className="text-sm text-gray-700">Current Value</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ₹{manualStats.currentValue.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Market value of holdings</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
                    <div className="text-sm text-gray-700">XIRR</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {manualStats.xirr !== null ? `${manualStats.xirr.toFixed(2)}%` : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Annualized return</div>
                  </div>
                </div>

                {/* P&L Breakdown Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                    <div className="text-sm text-gray-700">Realized P&L</div>
                    <div className={`text-2xl font-bold ${manualStats.totalRealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{manualStats.totalRealizedPnL.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">From sold positions</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-teal-500">
                    <div className="text-sm text-gray-700">Unrealized P&L</div>
                    <div className={`text-2xl font-bold ${manualStats.totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{manualStats.totalUnrealizedPnL.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">From current holdings</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
                    <div className="text-sm text-gray-700">Total P&L</div>
                    <div className={`text-2xl font-bold ${manualStats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{manualStats.totalPnl.toLocaleString('en-IN')}
                      <span className="text-sm ml-2">
                        ({manualStats.totalPnlPercent.toFixed(2)}%)
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Realized + Unrealized</div>
                  </div>
                </div>

                {/* Holdings Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Stock Holdings with XIRR ({manualStats.holdings.length} total, {manualStats.holdings.filter(h => h.quantity > 0).length} active)
                    </h2>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th 
                            onClick={() => handleSort('symbol')}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                          >
                            <div className="flex items-center">
                              Symbol {getSortIcon('symbol')}
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th 
                            onClick={() => handleSort('quantity')}
                            className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                          >
                            <div className="flex items-center justify-end">
                              Quantity {getSortIcon('quantity')}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleSort('avgPrice')}
                            className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                          >
                            <div className="flex items-center justify-end">
                              Avg Price {getSortIcon('avgPrice')}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleSort('investment')}
                            className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                          >
                            <div className="flex items-center justify-end">
                              Invested {getSortIcon('investment')}
                            </div>
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Current Price
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Current Value
                          </th>
                          <th 
                            onClick={() => handleSort('realizedPnL')}
                            className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                          >
                            <div className="flex items-center justify-end">
                              Realized P&L {getSortIcon('realizedPnL')}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleSort('unrealizedPnL')}
                            className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                          >
                            <div className="flex items-center justify-end">
                              Unrealized P&L {getSortIcon('unrealizedPnL')}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleSort('xirr')}
                            className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                          >
                            <div className="flex items-center justify-end">
                              XIRR {getSortIcon('xirr')}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getSortedAndFilteredHoldings(manualStats.holdings).map((holding) => {
                          const isClosed = holding.quantity === 0;
                          return (
                            <tr key={`${holding.symbol}-${holding.accountId}`} className={`hover:bg-gray-50 ${isClosed ? 'opacity-50 bg-gray-50' : ''}`}>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {holding.symbol}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                {holding.accountName}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">
                                {isClosed ? (
                                  <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                                    CLOSED
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                    ACTIVE
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                {holding.quantity.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                ₹{holding.avgPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                ₹{holding.investment.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                ₹{holding.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                ₹{holding.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </td>
                              <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-medium ${holding.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{holding.realizedPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </td>
                              <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-medium ${holding.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{holding.unrealizedPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600 font-semibold">
                                {holding.xirr !== null ? `${holding.xirr.toFixed(2)}%` : 'N/A'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-700 mb-4">No manual portfolio data available</p>
                <p className="text-sm text-gray-700 mb-4">
                  Import your Tradebook CSV to see holdings with XIRR calculations
                </p>
                <button
                  onClick={() => router.push('/import')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Import Data
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
