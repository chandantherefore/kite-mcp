'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Filter, Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface Account {
  id: number;
  name: string;
}

interface LedgerEntry {
  id: number;
  account_id: number;
  particular: string | null;
  posting_date: string;
  cost_center: string | null;
  voucher_type: string | null;
  debit: number;
  credit: number;
  net_balance: number | null;
}

interface AccountSummary {
  accountId: number;
  accountName: string;
  totalDebit: number;
  totalCredit: number;
  netCashFlow: number;
  investedValue: number;
  categories: {
    feesAndCharges: number;
    fundsAdded: number;
    internalAdjustment: number;
    fundsWithdrawn: number;
    dematMovement: number;
  };
  entries: LedgerEntry[];
}

export default function LedgerPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('consolidated');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [data, setData] = useState<AccountSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchLedger();
  }, []);

  useEffect(() => {
    fetchLedger();
  }, [selectedAccount, fromDate, toDate]);

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

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedAccount !== 'consolidated') {
        params.append('accountId', selectedAccount);
      }
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const response = await fetch(`/api/ledger?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate consolidated summary
  const getSummary = () => {
    const totalDebit = data.reduce((sum, acc) => sum + acc.totalDebit, 0);
    const totalCredit = data.reduce((sum, acc) => sum + acc.totalCredit, 0);
    const netCashFlow = totalCredit - totalDebit;
    const totalInvested = totalDebit;
    const totalWithdrawn = totalCredit;
    const availableCash = netCashFlow;
    
    // Category totals
    const feesAndCharges = data.reduce((sum, acc) => sum + acc.categories.feesAndCharges, 0);
    const fundsAdded = data.reduce((sum, acc) => sum + acc.categories.fundsAdded, 0);
    const internalAdjustment = data.reduce((sum, acc) => sum + acc.categories.internalAdjustment, 0);
    const fundsWithdrawn = data.reduce((sum, acc) => sum + acc.categories.fundsWithdrawn, 0);
    const dematMovement = data.reduce((sum, acc) => sum + acc.categories.dematMovement, 0);
    const investedValue = data.reduce((sum, acc) => sum + acc.investedValue, 0);

    return {
      totalInvested,
      totalWithdrawn,
      netCashFlow,
      availableCash,
      feesAndCharges,
      fundsAdded,
      internalAdjustment,
      fundsWithdrawn,
      dematMovement,
      investedValue,
      totalEntries: data.reduce((sum, acc) => sum + acc.entries.length, 0),
    };
  };

  const summary = getSummary();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${Math.abs(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ledger</h1>
          <p className="text-gray-600">Track your cash flows, investments, and withdrawals</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Account Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Total Invested</div>
              <ArrowDownCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalInvested)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Money Pumped In (Debit)</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Total Withdrawn</div>
              <ArrowUpCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalWithdrawn)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Money Taken Out (Credit)</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Net Cash Flow</div>
              <Wallet className="h-5 w-5 text-blue-500" />
            </div>
            <div className={`text-2xl font-bold ${summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.netCashFlow >= 0 ? '+' : '-'}{formatCurrency(summary.netCashFlow)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {summary.netCashFlow >= 0 ? 'More withdrawn than invested' : 'More invested than withdrawn'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Actual Invested</div>
              <TrendingDown className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(Math.abs(summary.netCashFlow))}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Current net investment in market
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Book Voucher</div>
              <div className="font-semibold text-gray-900">{formatCurrency(summary.feesAndCharges)}</div>
              <div className="text-xs text-gray-500 mt-1">Fees & Charges</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Bank Receipts</div>
              <div className="font-semibold text-green-700">{formatCurrency(summary.fundsAdded)}</div>
              <div className="text-xs text-gray-500 mt-1">Funds Added</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Journal Entry</div>
              <div className="font-semibold text-blue-700">{formatCurrency(summary.internalAdjustment)}</div>
              <div className="text-xs text-gray-500 mt-1">Internal Adjustment</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Bank Payments</div>
              <div className="font-semibold text-red-700">{formatCurrency(summary.fundsWithdrawn)}</div>
              <div className="text-xs text-gray-500 mt-1">Funds Withdrawn</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Delivery Voucher</div>
              <div className="font-semibold text-purple-700">{formatCurrency(summary.dematMovement)}</div>
              <div className="text-xs text-gray-500 mt-1">Demat Movement</div>
            </div>
          </div>
          
          {/* Invested Value Calculation */}
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-sm font-medium text-purple-900 mb-2">Actual Invested Value Calculation:</div>
            <div className="text-sm text-purple-800 space-y-1">
              <div className="flex justify-between">
                <span>Funds Added (Bank Receipts):</span>
                <span className="font-medium">+{formatCurrency(summary.fundsAdded)}</span>
              </div>
              <div className="flex justify-between">
                <span>Funds Withdrawn (Bank Payments):</span>
                <span className="font-medium">-{formatCurrency(summary.fundsWithdrawn)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fees & Charges (Book Voucher):</span>
                <span className="font-medium">-{formatCurrency(summary.feesAndCharges)}</span>
              </div>
              <div className="flex justify-between border-t border-purple-300 mt-2 pt-2 font-bold">
                <span>Actual Invested Value:</span>
                <span className="text-purple-900">{formatCurrency(summary.investedValue)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="text-sm text-blue-800">
            <strong>Understanding Your Ledger:</strong>
            <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
              <li><strong>Debit (Red)</strong>: Money you put into your trading account</li>
              <li><strong>Credit (Green)</strong>: Money you took out</li>
              <li><strong>Invested Value</strong>: Net amount after adding, withdrawing, and fees</li>
            </ul>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-600">Loading ledger entries...</div>
          </div>
        )}

        {/* Ledger Entries by Account */}
        {!loading && data.map((accountData) => (
          <div key={accountData.accountId} className="mb-8">
            {/* Account Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {accountData.accountName}
              </h2>
              <div className="flex gap-4 text-sm">
                <div className="text-red-600">
                  Invested: {formatCurrency(accountData.totalDebit)}
                </div>
                <div className="text-green-600">
                  Withdrawn: {formatCurrency(accountData.totalCredit)}
                </div>
                <div className={accountData.netCashFlow >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                  Net: {accountData.netCashFlow >= 0 ? '+' : ''}{formatCurrency(accountData.netCashFlow)}
                </div>
              </div>
            </div>

            {/* Entries Table */}
            {accountData.entries.length > 0 ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Particular</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {accountData.entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(entry.posting_date)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {entry.particular || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {entry.voucher_type || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {entry.debit > 0 ? (
                              <span className="text-red-600 font-medium">
                                {formatCurrency(entry.debit)}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {entry.credit > 0 ? (
                              <span className="text-green-600 font-medium">
                                {formatCurrency(entry.credit)}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                            {entry.net_balance !== null ? formatCurrency(entry.net_balance) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No ledger entries found
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {!loading && data.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">No ledger data available</p>
            <p className="text-sm text-gray-500">Import your ledger CSV to see cash flow analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}

