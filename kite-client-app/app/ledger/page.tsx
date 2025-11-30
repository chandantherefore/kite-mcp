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

interface CategoryBreakdown {
  debit: number;
  credit: number;
}

interface AccountSummary {
  accountId: number;
  accountName: string;
  totalDebit: number;
  totalCredit: number;
  netCashFlow: number;
  investedValue: number;
  categories: {
    feesAndCharges: CategoryBreakdown;
    fundsAdded: CategoryBreakdown;
    internalAdjustment: CategoryBreakdown;
    fundsWithdrawn: CategoryBreakdown;
    dematMovement: CategoryBreakdown;
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
    
    // Category totals - aggregate debit and credit separately
    const categories = {
      feesAndCharges: {
        debit: data.reduce((sum, acc) => sum + acc.categories.feesAndCharges.debit, 0),
        credit: data.reduce((sum, acc) => sum + acc.categories.feesAndCharges.credit, 0),
      },
      fundsAdded: {
        debit: data.reduce((sum, acc) => sum + acc.categories.fundsAdded.debit, 0),
        credit: data.reduce((sum, acc) => sum + acc.categories.fundsAdded.credit, 0),
      },
      internalAdjustment: {
        debit: data.reduce((sum, acc) => sum + acc.categories.internalAdjustment.debit, 0),
        credit: data.reduce((sum, acc) => sum + acc.categories.internalAdjustment.credit, 0),
      },
      fundsWithdrawn: {
        debit: data.reduce((sum, acc) => sum + acc.categories.fundsWithdrawn.debit, 0),
        credit: data.reduce((sum, acc) => sum + acc.categories.fundsWithdrawn.credit, 0),
      },
      dematMovement: {
        debit: data.reduce((sum, acc) => sum + acc.categories.dematMovement.debit, 0),
        credit: data.reduce((sum, acc) => sum + acc.categories.dematMovement.credit, 0),
      },
    };

    const investedValue = data.reduce((sum, acc) => sum + acc.investedValue, 0);

    return {
      totalInvested,
      totalWithdrawn,
      netCashFlow,
      availableCash,
      categories,
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
              <div className="text-sm text-gray-600">Total Used</div>
              <ArrowUpCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalWithdrawn)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Money Taken Out (Credit)</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Net Cash Balance</div>
              <Wallet className="h-5 w-5 text-blue-500" />
            </div>
            <div className={`text-2xl font-bold ${summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.netCashFlow >= 0 ? '+' : '-'}{formatCurrency(summary.netCashFlow)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {summary.netCashFlow >= 0 ? 'Cash Available' : 'Cash Used'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Avaiable for Withdrawal</div>
              <TrendingDown className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(Math.abs(summary.netCashFlow))}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Current net cash balance
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Book Voucher */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs font-semibold text-gray-700 mb-2">Book Voucher</div>
              <div className="text-xs text-gray-500 mb-3">Fees & Charges</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-red-600 font-medium">Debit:</span>
                  <span className="font-semibold">{formatCurrency(summary.categories.feesAndCharges.debit)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-green-600 font-medium">Credit:</span>
                  <span className="font-semibold">{formatCurrency(summary.categories.feesAndCharges.credit)}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-300">
                  <span className="font-bold text-gray-700">Difference:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(Math.abs(summary.categories.feesAndCharges.credit - summary.categories.feesAndCharges.debit))}</span>
                </div>
              </div>
            </div>

            {/* Bank Receipts */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xs font-semibold text-green-800 mb-2">Bank Receipts</div>
              <div className="text-xs text-gray-500 mb-3">Funds Added</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-red-600 font-medium">Debit:</span>
                  <span className="font-semibold">{formatCurrency(summary.categories.fundsAdded.debit)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-green-600 font-medium">Credit:</span>
                  <span className="font-semibold">{formatCurrency(summary.categories.fundsAdded.credit)}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-green-300">
                  <span className="font-bold text-green-700">Difference:</span>
                  <span className="font-bold text-green-900">{formatCurrency(Math.abs(summary.categories.fundsAdded.credit - summary.categories.fundsAdded.debit))}</span>
                </div>
              </div>
            </div>

            {/* Journal Entry */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs font-semibold text-blue-800 mb-2">Journal Entry</div>
              <div className="text-xs text-gray-500 mb-3">Internal Adjustment</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-red-600 font-medium">Debit:</span>
                  <span className="font-semibold">{formatCurrency(summary.categories.internalAdjustment.debit)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-green-600 font-medium">Credit:</span>
                  <span className="font-semibold">{formatCurrency(summary.categories.internalAdjustment.credit)}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-blue-300">
                  <span className="font-bold text-blue-700">Difference:</span>
                  <span className="font-bold text-blue-900">{formatCurrency(Math.abs(summary.categories.internalAdjustment.credit - summary.categories.internalAdjustment.debit))}</span>
                </div>
              </div>
            </div>

            {/* Bank Payments */}
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-xs font-semibold text-red-800 mb-2">Bank Payments</div>
              <div className="text-xs text-gray-500 mb-3">Funds Withdrawn</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-red-600 font-medium">Debit:</span>
                  <span className="font-semibold">{formatCurrency(summary.categories.fundsWithdrawn.debit)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-green-600 font-medium">Credit:</span>
                  <span className="font-semibold">{formatCurrency(summary.categories.fundsWithdrawn.credit)}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-red-300">
                  <span className="font-bold text-red-700">Difference:</span>
                  <span className="font-bold text-red-900">{formatCurrency(Math.abs(summary.categories.fundsWithdrawn.credit - summary.categories.fundsWithdrawn.debit))}</span>
                </div>
              </div>
            </div>

            {/* Delivery Voucher */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-xs font-semibold text-purple-800 mb-2">Delivery Voucher</div>
              <div className="text-xs text-gray-500 mb-3">Demat Movement</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-red-600 font-medium">Debit:</span>
                  <span className="font-semibold">{formatCurrency(summary.categories.dematMovement.debit)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-green-600 font-medium">Credit:</span>
                  <span className="font-semibold">{formatCurrency(summary.categories.dematMovement.credit)}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-purple-300">
                  <span className="font-bold text-purple-700">Difference:</span>
                  <span className="font-bold text-purple-900">{formatCurrency(Math.abs(summary.categories.dematMovement.credit - summary.categories.dematMovement.debit))}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Invested Value Calculation */}
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-sm font-medium text-purple-900 mb-2">Actual Invested Value Calculation:</div>
            <div className="text-sm text-purple-800 space-y-1">
              <div className="flex justify-between">
                <span>Funds Added (Bank Receipts - Debit):</span>
                <span className="font-medium">{formatCurrency(summary.categories.fundsAdded.credit - summary.categories.fundsAdded.debit)}</span>
              </div>
              <div className="flex justify-between">
                <span>Funds Withdrawn (Bank Payments - Credit):</span>
                <span className="font-medium">-{formatCurrency(summary.categories.fundsWithdrawn.credit - summary.categories.fundsWithdrawn.debit)}</span>
              </div>
              <div className="flex justify-between border-t border-purple-300 mt-2 pt-2 font-bold">
                <span>Actual Invested Value:</span>
                <span className="text-purple-900">{formatCurrency((summary.categories.fundsAdded.credit - summary.categories.fundsAdded.debit)- (summary.categories.fundsWithdrawn.debit - summary.categories.fundsWithdrawn.credit))}</span>
              </div>
              <div className="text-xs text-purple-600 mt-2 italic">
                Formula: Bank Receipts (Debit) - Bank Payments (Credit)
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

