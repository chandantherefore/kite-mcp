'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Filter, TrendingUp, TrendingDown, Edit2, Save, X, RefreshCw, Plus } from 'lucide-react';
import PageShortcuts from '@/components/PageShortcuts';
import { equityLinks } from '@/lib/links';

interface Account {
  id: number;
  name: string;
}

interface Trade {
  id: number;
  symbol: string;
  trade_date: string;
  trade_type: 'buy' | 'sell';
  quantity: number;
  price: number;
  exchange: string;
  order_id: string;
}

interface TradeGroup {
  symbol: string;
  accountId: number;
  accountName: string;
  totalBuyQuantity: number;
  totalSellQuantity: number;
  netQuantity: number;
  totalBuyValue: number;
  totalSellValue: number;
  avgBuyPrice: number;
  avgSellPrice: number;
  currentPrice: number;
  currentValue: number;
  realizedPnL: number;
  realizedPnLPercent: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  totalPnL: number;
  status: 'active' | 'sold';
  xirr: number | null;
  trades: Trade[];
  firstTradeDate: string;
  lastTradeDate: string;
}

interface TradebookData {
  groups: TradeGroup[];
  summary: {
    totalStocks: number;
    activeStocks: number;
    soldStocks: number;
    totalBuyValue: number;
    totalSellValue: number;
    totalRealizedPnL: number;
    totalUnrealizedPnL: number;
  };
}

export default function TradebookPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('consolidated');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [data, setData] = useState<TradebookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingTrade, setEditingTrade] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ symbol?: string; quantity?: string; price?: string }>({});
  const [bulkEditSymbol, setBulkEditSymbol] = useState<string>('');
  const [newSymbolName, setNewSymbolName] = useState<string>('');
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [newTrade, setNewTrade] = useState({
    accountId: '',
    symbol: '',
    tradeDate: new Date().toISOString().split('T')[0],
    tradeType: 'buy' as 'buy' | 'sell',
    quantity: '',
    price: '',
    exchange: 'NSE',
    segment: 'EQ',
    series: 'EQ',
  });

  useEffect(() => {
    fetchAccounts();
    fetchTradebook();
  }, []);

  useEffect(() => {
    fetchTradebook();
  }, [selectedAccount, fromDate, toDate, statusFilter]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      const result = await response.json();
      if (result.success) {
        setAccounts(result.accounts);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  const fetchTradebook = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (selectedAccount && selectedAccount !== 'consolidated') {
        params.append('accountId', selectedAccount);
      }
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/tradebook?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError('Failed to fetch tradebook data');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedGroups(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const startEditingTrade = (trade: Trade) => {
    setEditingTrade(trade.id);
    setEditValues({
      symbol: trade.symbol || '',
      quantity: parseFloat(trade.quantity.toString()).toString(),
      price: parseFloat(trade.price.toString()).toString(),
    });
  };

  const cancelEditing = () => {
    setEditingTrade(null);
    setEditValues({});
  };

  const saveTrade = async (tradeId: number) => {
    try {
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues),
      });

      const result = await response.json();

      if (result.success) {
        setEditingTrade(null);
        setEditValues({});
        fetchTradebook(); // Refresh data
      } else {
        alert('Error updating trade: ' + result.error);
      }
    } catch (err) {
      console.error('Error saving trade:', err);
      alert('Failed to save trade');
    }
  };

  const handleBulkRename = async () => {
    if (!bulkEditSymbol || !newSymbolName) {
      alert('Please enter both old and new symbol names');
      return;
    }

    if (bulkEditSymbol === newSymbolName) {
      alert('Old and new symbol names must be different');
      return;
    }

    const confirm = window.confirm(
      `Are you sure you want to rename all "${bulkEditSymbol}" trades to "${newSymbolName}"?`
    );

    if (!confirm) return;

    try {
      const params: any = {
        action: 'rename_symbol',
        oldSymbol: bulkEditSymbol,
        newSymbol: newSymbolName,
      };

      if (selectedAccount && selectedAccount !== 'consolidated') {
        params.accountId = selectedAccount;
      }

      const response = await fetch('/api/trades/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Successfully updated ${result.affectedRows} trade(s)`);
        setBulkEditSymbol('');
        setNewSymbolName('');
        setShowBulkEdit(false);
        fetchTradebook(); // Refresh data
      } else {
        alert('Error: ' + result.error);
      }
    } catch (err) {
      console.error('Error in bulk rename:', err);
      alert('Failed to rename symbol');
    }
  };

  const handleAddTrade = async () => {
    // Validate required fields
    if (!newTrade.accountId || !newTrade.symbol || !newTrade.tradeDate || 
        !newTrade.quantity || !newTrade.price) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrade),
      });

      const result = await response.json();

      if (result.success) {
        alert('Trade added successfully!');
        // Reset form
        setNewTrade({
          accountId: newTrade.accountId, // Keep account selected
          symbol: '',
          tradeDate: new Date().toISOString().split('T')[0],
          tradeType: 'buy',
          quantity: '',
          price: '',
          exchange: 'NSE',
          segment: 'EQ',
          series: 'EQ',
        });
        setShowAddTrade(false);
        fetchTradebook(); // Refresh data
      } else {
        alert('Error adding trade: ' + result.error);
      }
    } catch (err) {
      console.error('Error adding trade:', err);
      alert('Failed to add trade');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageShortcuts links={equityLinks} title="Equity" />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tradebook</h1>
          <p className="text-gray-700">View all imported trades grouped by script with P&L analysis</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Account Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Account
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
              >
                <option value="consolidated">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Position Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
              >
                <option value="all">All Positions</option>
                <option value="active">Active Holdings</option>
                <option value="sold">Sold Holdings</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Edit Tool */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowBulkEdit(!showBulkEdit)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Edit2 className="h-4 w-4" />
              <span>Bulk Rename Symbol</span>
              {showBulkEdit ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {showBulkEdit && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Old Symbol Name
                </label>
                <input
                  type="text"
                  value={bulkEditSymbol}
                  onChange={(e) => setBulkEditSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g., HDFCBANK"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  New Symbol Name
                </label>
                <input
                  type="text"
                  value={newSymbolName}
                  onChange={(e) => setNewSymbolName(e.target.value.toUpperCase())}
                  placeholder="e.g., HDFCBANK_NEW"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div>
                <button
                  onClick={handleBulkRename}
                  disabled={!bulkEditSymbol || !newSymbolName}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Rename All Trades</span>
                </button>
              </div>

              <div className="col-span-3 text-sm text-gray-700">
                <strong>Note:</strong> This will rename all trades with symbol "{bulkEditSymbol}" 
                {selectedAccount !== 'consolidated' && ` in the selected account`} to "{newSymbolName}". 
                Use this when a stock symbol changes (e.g., merger, name change).
              </div>
            </div>
          )}
        </div>

        {/* Manual Trade Entry */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAddTrade(!showAddTrade)}
              className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Trade</span>
              {showAddTrade ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {showAddTrade && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Account */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Account <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={newTrade.accountId}
                    onChange={(e) => setNewTrade({ ...newTrade, accountId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Symbol */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Symbol <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTrade.symbol}
                    onChange={(e) => setNewTrade({ ...newTrade, symbol: e.target.value.toUpperCase() })}
                    placeholder="e.g., RELIANCE"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"
                    required
                  />
                </div>

                {/* Trade Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Trade Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={newTrade.tradeDate}
                    onChange={(e) => setNewTrade({ ...newTrade, tradeDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"
                    required
                  />
                </div>

                {/* Trade Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Trade Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={newTrade.tradeType}
                    onChange={(e) => setNewTrade({ ...newTrade, tradeType: e.target.value as 'buy' | 'sell' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"
                    required
                  >
                    <option value="buy">BUY</option>
                    <option value="sell">SELL</option>
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Quantity <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrade.quantity}
                    onChange={(e) => setNewTrade({ ...newTrade, quantity: e.target.value })}
                    placeholder="e.g., 10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"
                    required
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Price <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrade.price}
                    onChange={(e) => setNewTrade({ ...newTrade, price: e.target.value })}
                    placeholder="e.g., 2500.50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"
                    required
                  />
                </div>

                {/* Exchange */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Exchange
                  </label>
                  <select
                    value={newTrade.exchange}
                    onChange={(e) => setNewTrade({ ...newTrade, exchange: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"
                  >
                    <option value="NSE">NSE</option>
                    <option value="BSE">BSE</option>
                    <option value="NFO">NFO</option>
                    <option value="MCX">MCX</option>
                  </select>
                </div>

                {/* Segment */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Segment
                  </label>
                  <input
                    type="text"
                    value={newTrade.segment}
                    onChange={(e) => setNewTrade({ ...newTrade, segment: e.target.value })}
                    placeholder="e.g., EQ"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"
                  />
                </div>

                {/* Series */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Series
                  </label>
                  <input
                    type="text"
                    value={newTrade.series}
                    onChange={(e) => setNewTrade({ ...newTrade, series: e.target.value })}
                    placeholder="e.g., EQ"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Trade Value Preview */}
              {newTrade.quantity && newTrade.price && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-700">Trade Value:</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{(parseFloat(newTrade.quantity) * parseFloat(newTrade.price)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddTrade}
                  disabled={!newTrade.accountId || !newTrade.symbol || !newTrade.quantity || !newTrade.price}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Trade</span>
                </button>
                <button
                  onClick={() => {
                    setShowAddTrade(false);
                    setNewTrade({
                      accountId: '',
                      symbol: '',
                      tradeDate: new Date().toISOString().split('T')[0],
                      tradeType: 'buy',
                      quantity: '',
                      price: '',
                      exchange: 'NSE',
                      segment: 'EQ',
                      series: 'EQ',
                    });
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>

              <div className="text-sm text-gray-700">
                <strong>Note:</strong> Fields marked with <span className="text-red-600">*</span> are required.
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <div className="text-sm text-gray-600">Active</div>
              <div className="text-2xl font-bold text-green-600">{data.summary.activeStocks}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-400">
              <div className="text-sm text-gray-600">Sold</div>
              <div className="text-2xl font-bold text-gray-600">{data.summary.soldStocks}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
              <div className="text-sm text-gray-600">Total Buy Value</div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(data.summary.totalBuyValue)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
              <div className="text-sm text-gray-600">Realized P&L</div>
              <div className={`text-lg font-bold ${data.summary.totalRealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.summary.totalRealizedPnL)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-teal-500">
              <div className="text-sm text-gray-600">Unrealized P&L</div>
              <div className={`text-lg font-bold ${data.summary.totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.summary.totalUnrealizedPnL)}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
            <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-700">Loading tradebook data...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Tradebook Groups */}
        {!loading && data && data.groups.length > 0 && (
          <div className="space-y-2">
            {data.groups.map((group) => {
              const key = `${group.symbol}_${group.accountId}`;
              const isExpanded = expandedGroups.has(key);
              const isSold = group.status === 'sold';

              return (
                <div
                  key={key}
                  className={`bg-white rounded-lg shadow overflow-hidden transition-all ${
                    isSold ? 'opacity-60' : ''
                  }`}
                >
                  {/* Group Header */}
                  <div
                    onClick={() => toggleGroup(key)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSold ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Symbol */}
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-600" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-600" />
                          )}
                          <span className={`font-bold text-lg ${isSold ? 'text-gray-600' : 'text-gray-900'}`}>
                            {group.symbol}
                          </span>
                            {isSold && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded">
                              SOLD
                            </span>
                          )}
                          {!isSold && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              ACTIVE
                            </span>
                          )}
                        </div>

                        {/* Account Name */}
                        <div className="text-sm text-gray-700">
                          {group.accountName}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm">
                        {/* Net Quantity */}
                        <div className="text-right min-w-[80px]">
                          <div className="text-xs text-gray-700">Net Qty</div>
                          <div className={`font-bold ${isSold ? 'text-gray-600' : 'text-blue-600'}`}>
                            {group.netQuantity.toFixed(2)}
                          </div>
                        </div>

                        {/* Buy/Sell Values */}
                        <div className="text-right min-w-[100px]">
                          <div className="text-xs text-gray-700">Buy / Sell</div>
                          <div className="font-medium text-gray-900">
                            {formatCurrency(group.totalBuyValue)}
                            <span className="text-gray-400 mx-1">/</span>
                            {formatCurrency(group.totalSellValue)}
                          </div>
                        </div>

                        {/* Current Price (Live) */}
                        <div className="text-right min-w-[100px]">
                          <div className="text-xs text-gray-700">Current Price</div>
                          <div className="font-medium text-gray-900">
                            {group.currentPrice > 0 ? formatCurrency(group.currentPrice) : 'N/A'}
                            {group.currentPrice > 0 && (
                              <span className="text-xs text-green-600 ml-1">🔴 Live</span>
                            )}
                          </div>
                        </div>

                        {/* Realized P&L */}
                        <div className="text-right min-w-[110px]">
                          <div className="text-xs text-gray-700">Realized P&L</div>
                          <div className={`font-bold flex items-center justify-end gap-1 ${
                            group.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {group.realizedPnL >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {formatCurrency(Math.abs(group.realizedPnL))}
                          </div>
                            <div className="text-xs text-gray-700">
                              ({group.realizedPnLPercent.toFixed(2)}%)
                            </div>
                        </div>

                        {/* Unrealized P&L (for active only) */}
                        {!isSold && (
                          <div className="text-right min-w-[110px]">
                            <div className="text-xs text-gray-700">Unrealized P&L</div>
                            <div className={`font-bold flex items-center justify-end gap-1 ${
                              group.unrealizedPnL >= 0 ? 'text-blue-600' : 'text-orange-600'
                            }`}>
                              {group.unrealizedPnL >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {formatCurrency(Math.abs(group.unrealizedPnL))}
                            </div>
                            <div className="text-xs text-gray-700">
                              ({group.unrealizedPnLPercent.toFixed(2)}%)
                            </div>
                          </div>
                        )}

                        {/* Current Value (for sold, show sell value) */}
                        {isSold && group.totalSellValue > 0 && (
                          <div className="text-right min-w-[110px]">
                            <div className="text-xs text-gray-700">Sold At</div>
                            <div className="font-medium text-gray-700">
                              {formatCurrency(group.totalSellValue)}
                            </div>
                          </div>
                        )}

                        {/* XIRR */}
                        <div className="text-right min-w-[80px]">
                          <div className="text-xs text-gray-700">XIRR</div>
                          <div className="font-semibold text-gray-900">
                            {group.xirr !== null ? `${group.xirr.toFixed(2)}%` : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="mt-2 text-xs text-gray-700">
                      Period: {formatDate(group.firstTradeDate)} → {formatDate(group.lastTradeDate)}
                      {' • '}
                      {group.trades.length} trade{group.trades.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Expanded Trade Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exchange</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {group.trades.map((trade) => {
                            const qty = parseFloat(trade.quantity.toString());
                            const price = parseFloat(trade.price.toString());
                            const isEditing = editingTrade === trade.id;
                            
                            return (
                              <tr key={trade.id} className={`hover:bg-gray-50 ${isEditing ? 'bg-blue-50' : ''}`}>
                                {/* Symbol */}
                                <td className="px-4 py-3 text-sm">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editValues.symbol || ''}
                                      onChange={(e) => setEditValues({ ...editValues, symbol: e.target.value.toUpperCase() })}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    />
                                  ) : (
                                    <span className="font-medium text-gray-900">{trade.symbol}</span>
                                  )}
                                </td>

                                {/* Date */}
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {formatDate(trade.trade_date)}
                                </td>

                                {/* Type */}
                                <td className="px-4 py-3 text-sm">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    trade.trade_type === 'buy' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {trade.trade_type.toUpperCase()}
                                  </span>
                                </td>

                                {/* Quantity */}
                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editValues.quantity || ''}
                                      onChange={(e) => setEditValues({ ...editValues, quantity: e.target.value })}
                                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    />
                                  ) : (
                                    qty.toFixed(2)
                                  )}
                                </td>

                                {/* Price */}
                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editValues.price || ''}
                                      onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                                      className="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    />
                                  ) : (
                                    formatCurrency(price)
                                  )}
                                </td>

                                {/* Value */}
                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                  {isEditing 
                                    ? formatCurrency(parseFloat(editValues.quantity || '0') * parseFloat(editValues.price || '0'))
                                    : formatCurrency(qty * price)
                                  }
                                </td>

                                {/* Exchange */}
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  {trade.exchange || 'N/A'}
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3 text-sm text-center">
                                  {isEditing ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => saveTrade(trade.id)}
                                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                                        title="Save"
                                      >
                                        <Save className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={cancelEditing}
                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                        title="Cancel"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => startEditingTrade(trade)}
                                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                      title="Edit"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && data && data.groups.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-700 mb-4">No trades found with the selected filters</p>
            <p className="text-sm text-gray-700">
              Try adjusting your filters or import tradebook data
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

