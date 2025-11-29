'use client';

import { useState, useEffect } from 'react';
import { GitBranch, Info } from 'lucide-react';

interface Account {
  id: number;
  name: string;
}

interface PreviewTrade {
  trade_id: string;
  symbol: string;
  trade_date: string;
  old_quantity: number;
  new_quantity: number;
  old_price: number;
  new_price: number;
}

export default function ToolsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [splitDate, setSplitDate] = useState<string>('');
  const [ratio, setRatio] = useState<string>('1:5');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewTrade[] | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchSymbols();
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

  const fetchSymbols = async () => {
    try {
      const response = await fetch(`/api/tools/split?accountId=${selectedAccount}`);
      const data = await response.json();
      
      if (data.success) {
        setSymbols(data.symbols);
      }
    } catch (err) {
      console.error('Failed to fetch symbols:', err);
    }
  };

  const handlePreview = async () => {
    if (!selectedAccount || !selectedSymbol || !splitDate || !ratio) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const response = await fetch('/api/tools/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccount,
          symbol: selectedSymbol,
          splitDate,
          ratio,
          preview: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPreview(data.trades || []);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!confirm(`Are you sure you want to apply ${ratio} stock split for ${selectedSymbol}? This will modify ${preview?.length || 0} trades.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tools/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccount,
          symbol: selectedSymbol,
          splitDate,
          ratio,
          preview: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        setPreview(null);
        // Reset form
        setSelectedSymbol('');
        setSplitDate('');
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Failed to apply split');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio Tools</h1>
          <p className="text-gray-600">Utilities for managing your portfolio data</p>
        </div>

        {/* Stock Split Tool */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <GitBranch className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Stock Split Adjustment</h2>
              <p className="text-sm text-gray-600">
                Apply historical stock splits to your imported trades
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Select the stock that underwent a split</li>
                  <li>Enter the split date and ratio (e.g., "1:5" means 1 share becomes 5)</li>
                  <li>Preview changes before applying</li>
                  <li>All trades before the split date will be adjusted</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              ✅ {result.message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Account *
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">-- Select Account --</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Stock Symbol *
              </label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedAccount || loading}
              >
                <option value="">-- Select Symbol --</option>
                {symbols.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Split Date *
              </label>
              <input
                type="date"
                value={splitDate}
                onChange={(e) => setSplitDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Split Ratio * (old:new)
              </label>
              <input
                type="text"
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
                placeholder="e.g., 1:5, 1:2, 1:10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Examples: "1:5" (1 share becomes 5), "1:2" (1 becomes 2)
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePreview}
              disabled={loading || !selectedAccount || !selectedSymbol || !splitDate || !ratio}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Preview Changes'}
            </button>

            {preview && preview.length > 0 && (
              <button
                onClick={handleApply}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
              >
                Apply Split
              </button>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="mt-6">
              <h3 className="font-semibold mb-4">
                Preview: {preview.length} trades will be adjusted
              </h3>
              
              {preview.length === 0 ? (
                <p className="text-gray-600">No trades found before the split date.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Trade ID</th>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-right">Old Qty</th>
                        <th className="px-4 py-2 text-right">New Qty</th>
                        <th className="px-4 py-2 text-right">Old Price</th>
                        <th className="px-4 py-2 text-right">New Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {preview.slice(0, 10).map((trade) => (
                        <tr key={trade.trade_id}>
                          <td className="px-4 py-2">{trade.trade_id}</td>
                          <td className="px-4 py-2">
                            {new Date(trade.trade_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-right">{trade.old_quantity}</td>
                          <td className="px-4 py-2 text-right font-semibold text-green-600">
                            {trade.new_quantity}
                          </td>
                          <td className="px-4 py-2 text-right">₹{trade.old_price.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right font-semibold text-green-600">
                            ₹{trade.new_price.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.length > 10 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Showing 10 of {preview.length} trades
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

