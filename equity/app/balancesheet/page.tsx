'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, PieChart, Calendar, Plus, Building2 } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalIncome: number;
  totalExpense: number;
  incomeByCategory: Array<{ category_id: number; category_name: string; total: number }>;
  expenseByCategory: Array<{ category_id: number; category_name: string; total: number }>;
  incomeByAccount: Array<{ bank_id: number; bank_name: string; total: number }>;
  expenseByAccount: Array<{ bank_id: number; bank_name: string; total: number }>;
}

interface UpcomingRecurring {
  recurring: {
    id: number;
    category_id: number;
    bank_id: number;
    type: 'income' | 'expense';
    amount: number;
    description: string | null;
  };
  category_name: string;
  bank_name: string;
  next_month: number;
  next_year: number;
  already_added: boolean;
}

interface BankProjection {
  bank_id: number;
  bank_name: string;
  current_balance: number;
  current_month_income: number;
  current_month_expense: number;
  projected_end_balance: number;
  recurring_income: number;
  recurring_expense: number;
}

export default function BalanceSheetDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [upcomingRecurring, setUpcomingRecurring] = useState<UpcomingRecurring[]>([]);
  const [bankProjections, setBankProjections] = useState<BankProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [addingRecurring, setAddingRecurring] = useState<number | null>(null);

  useEffect(() => {
    fetchStats();
    fetchUpcomingRecurring();
    fetchBankProjections();
  }, [selectedMonth, selectedYear]);

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth.toString());
      if (selectedYear) params.append('year', selectedYear.toString());

      const response = await fetch(`/api/balancesheet/stats?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setStats(result.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchUpcomingRecurring = async () => {
    try {
      const response = await fetch('/api/balancesheet/upcoming-recurring?monthsAhead=3');
      const result = await response.json();
      if (result.success) {
        setUpcomingRecurring(result.upcoming);
      }
    } catch (err) {
      console.error('Failed to fetch upcoming recurring:', err);
    }
  };

  const fetchBankProjections = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const params = new URLSearchParams();
      params.append('month', (selectedMonth || now.getMonth() + 1).toString());
      params.append('year', (selectedYear || now.getFullYear()).toString());

      const response = await fetch(`/api/balancesheet/bank-projections?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setBankProjections(result.projections);
      }
    } catch (err) {
      console.error('Failed to fetch bank projections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecurring = async (recurringId: number, month: number, year: number) => {
    setAddingRecurring(recurringId);
    try {
      const response = await fetch(`/api/balancesheet/recurring/${recurringId}/add-to-month`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      });
      const result = await response.json();
      if (result.success) {
        await fetchUpcomingRecurring();
        await fetchBankProjections();
        await fetchStats();
        alert('Transaction added successfully!');
      } else {
        alert(result.error || 'Failed to add transaction');
      }
    } catch (err: any) {
      console.error('Error adding recurring:', err);
      alert(err.message || 'Failed to add transaction');
    } finally {
      setAddingRecurring(null);
    }
  };

  const netAmount = stats ? stats.totalIncome - stats.totalExpense : 0;
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Generate month options
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  // Generate year options (current year and 5 years back)
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Balance Sheet Dashboard
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                value={selectedMonth || ''}
                onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Months</option>
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setSelectedMonth(null);
                setSelectedYear(null);
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-700">Loading dashboard...</div>
          </div>
        ) : stats ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="bg-white overflow-hidden shadow rounded-lg p-5 border-l-4 border-green-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Income
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ₹{stats.totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </dd>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg p-5 border-l-4 border-red-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Expense
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ₹{stats.totalExpense.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </dd>
                  </div>
                </div>
              </div>

              <div className={`bg-white overflow-hidden shadow rounded-lg p-5 border-l-4 ${netAmount >= 0 ? 'border-green-500' : 'border-red-500'}`}>
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-md p-3 ${netAmount >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Wallet className={`h-6 w-6 ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Net Amount
                    </dt>
                    <dd className={`text-lg font-medium ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{netAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </dd>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg p-5 border-l-4 border-blue-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Period
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {selectedMonth && selectedYear
                        ? `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                        : selectedYear
                        ? `${selectedYear}`
                        : 'All Time'}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Income by Category */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Income by Category</h3>
                {stats.incomeByCategory.length > 0 ? (
                  <div className="space-y-3">
                    {stats.incomeByCategory.map((item) => (
                      <div key={item.category_id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{item.category_name}</span>
                        <span className="text-sm font-medium text-green-600">
                          ₹{item.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No income data available</p>
                )}
              </div>

              {/* Expense by Category */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense by Category</h3>
                {stats.expenseByCategory.length > 0 ? (
                  <div className="space-y-3">
                    {stats.expenseByCategory.map((item) => (
                      <div key={item.category_id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{item.category_name}</span>
                        <span className="text-sm font-medium text-red-600">
                          ₹{item.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No expense data available</p>
                )}
              </div>

              {/* Income by Account */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Income by Account</h3>
                {stats.incomeByAccount.length > 0 ? (
                  <div className="space-y-3">
                    {stats.incomeByAccount.map((item) => (
                      <div key={item.bank_id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{item.bank_name}</span>
                        <span className="text-sm font-medium text-green-600">
                          ₹{item.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No income data available</p>
                )}
              </div>

              {/* Expense by Account */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense by Account</h3>
                {stats.expenseByAccount.length > 0 ? (
                  <div className="space-y-3">
                    {stats.expenseByAccount.map((item) => (
                      <div key={item.bank_id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{item.bank_name}</span>
                        <span className="text-sm font-medium text-red-600">
                          ₹{item.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No expense data available</p>
                )}
              </div>
            </div>

            {/* Upcoming Recurring Transactions */}
            {upcomingRecurring.length > 0 && (
              <div className="mb-6 bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Recurring Transactions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingRecurring.slice(0, 6).map((item, idx) => {
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return (
                      <div
                        key={`${item.recurring.id}-${item.next_month}-${item.next_year}`}
                        className={`p-4 rounded-lg border ${
                          item.recurring.type === 'income' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.category_name}</div>
                            <div className="text-sm text-gray-600">Account: {item.bank_name}</div>
                            <div className="text-sm text-gray-500">
                              {monthNames[item.next_month - 1]} {item.next_year}
                            </div>
                            <div className={`text-sm font-semibold mt-1 ${
                              item.recurring.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ₹{item.recurring.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddRecurring(item.recurring.id, item.next_month, item.next_year)}
                            disabled={addingRecurring === item.recurring.id}
                            className={`ml-2 px-3 py-1 text-xs rounded-lg ${
                              item.recurring.type === 'income'
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {addingRecurring === item.recurring.id ? 'Adding...' : 'Add'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {upcomingRecurring.length > 6 && (
                  <Link
                    href="/balancesheet/recurring"
                    className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700"
                  >
                    View all recurring transactions →
                  </Link>
                )}
              </div>
            )}

            {/* Bank Balance Projections */}
            {bankProjections.length > 0 && (
              <div className="mb-6 bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Balance Projections</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Balance</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Month Income</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Month Expense</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Recurring Income</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Recurring Expense</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Projected End Balance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bankProjections.map((proj) => (
                        <tr key={proj.bank_id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{proj.bank_name}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">
                            ₹{proj.current_balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-green-600">
                            ₹{proj.current_month_income.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-red-600">
                            ₹{proj.current_month_expense.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-green-600">
                            ₹{proj.recurring_income.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-red-600">
                            ₹{proj.recurring_expense.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right font-semibold ${
                            proj.projected_end_balance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ₹{proj.projected_end_balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/balancesheet/categories"
                className="block p-4 bg-white shadow rounded-lg hover:bg-gray-50 transition text-center"
              >
                <h3 className="text-sm font-medium text-gray-900">Manage Categories</h3>
              </Link>
              <Link
                href="/balancesheet/banks"
                className="block p-4 bg-white shadow rounded-lg hover:bg-gray-50 transition text-center"
              >
                <h3 className="text-sm font-medium text-gray-900">Manage Banks</h3>
              </Link>
              <Link
                href="/balancesheet/income"
                className="block p-4 bg-white shadow rounded-lg hover:bg-gray-50 transition text-center"
              >
                <h3 className="text-sm font-medium text-gray-900">Manage Income</h3>
              </Link>
              <Link
                href="/balancesheet/expenses"
                className="block p-4 bg-white shadow rounded-lg hover:bg-gray-50 transition text-center"
              >
                <h3 className="text-sm font-medium text-gray-900">Manage Expenses</h3>
              </Link>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-700">No data available. Start by adding categories, banks, and transactions.</p>
          </div>
        )}
      </main>
    </div>
  );
}

