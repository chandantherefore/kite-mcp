'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
}

interface Bank {
  id: number;
  name: string;
}

interface Recurring {
  id: number;
  category_id: number;
  bank_id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
}

export default function RecurringPage() {
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    bankId: '',
    type: 'income' as 'income' | 'expense',
    amount: '',
    description: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [addingToMonth, setAddingToMonth] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchBanks();
    fetchRecurring();
  }, []);

  const fetchCategories = async () => {
    try {
      const incomeResponse = await fetch('/api/balancesheet/categories?type=income');
      const expenseResponse = await fetch('/api/balancesheet/categories?type=expense');
      const incomeResult = await incomeResponse.json();
      const expenseResult = await expenseResponse.json();
      
      if (incomeResult.success && expenseResult.success) {
        setCategories([...incomeResult.categories, ...expenseResult.categories]);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await fetch('/api/balancesheet/banks');
      const result = await response.json();
      if (result.success) {
        setBanks(result.banks);
      }
    } catch (err) {
      console.error('Failed to fetch banks:', err);
    }
  };

  const fetchRecurring = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/balancesheet/recurring');
      const result = await response.json();
      if (result.success) {
        setRecurring(result.recurring);
      }
    } catch (err) {
      console.error('Failed to fetch recurring transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update
        const response = await fetch(`/api/balancesheet/recurring/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId: parseInt(formData.categoryId),
            bankId: parseInt(formData.bankId),
            amount: parseFloat(formData.amount),
            description: formData.description || null,
          }),
        });
        const result = await response.json();
        if (result.success) {
          await fetchRecurring();
          resetForm();
        } else {
          alert(result.error || 'Failed to update recurring transaction');
        }
      } else {
        // Create
        const response = await fetch('/api/balancesheet/recurring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const result = await response.json();
        if (result.success) {
          await fetchRecurring();
          resetForm();
        } else {
          alert(result.error || 'Failed to create recurring transaction');
        }
      }
    } catch (err) {
      console.error('Error saving recurring transaction:', err);
      alert('Failed to save recurring transaction');
    }
  };

  const handleEdit = (item: Recurring) => {
    setEditingId(item.id);
    setFormData({
      categoryId: item.category_id.toString(),
      bankId: item.bank_id.toString(),
      type: item.type,
      amount: item.amount.toString(),
      description: item.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this recurring transaction?')) return;

    try {
      const response = await fetch(`/api/balancesheet/recurring/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await fetchRecurring();
      } else {
        alert(result.error || 'Failed to delete recurring transaction');
      }
    } catch (err) {
      console.error('Error deleting recurring transaction:', err);
      alert('Failed to delete recurring transaction');
    }
  };

  const handleAddToMonth = async (id: number) => {
    setAddingToMonth(id);
    try {
      const now = new Date();
      const response = await fetch(`/api/balancesheet/recurring/${id}/add-to-month`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        }),
      });
      const result = await response.json();
      if (result.success) {
        alert('Transaction added to current month successfully!');
      } else {
        alert(result.error || 'Failed to add transaction to month');
      }
    } catch (err) {
      console.error('Error adding to month:', err);
      alert('Failed to add transaction to month');
    } finally {
      setAddingToMonth(null);
    }
  };

  const resetForm = () => {
    setFormData({
      categoryId: '',
      bankId: '',
      type: 'income',
      amount: '',
      description: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getCategoryName = (categoryId: number) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  const getBankName = (bankId: number) => {
    return banks.find(b => b.id === bankId)?.name || 'Unknown';
  };

  const incomeRecurring = recurring.filter(r => r.type === 'income');
  const expenseRecurring = recurring.filter(r => r.type === 'expense');
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Recurring Transactions
            </h1>
            <Link
              href="/balancesheet"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        {/* Add/Edit Form */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingId ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}
            </h2>
            {showForm && (
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Recurring Transaction
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categories
                      .filter(c => c.type === formData.type)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account *
                  </label>
                  <select
                    required
                    value={formData.bankId}
                    onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Account</option>
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="h-4 w-4" />
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Recurring Transactions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-700">Loading recurring transactions...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recurring Income */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-green-600">
                Recurring Income ({incomeRecurring.length})
              </h3>
              {incomeRecurring.length > 0 ? (
                <div className="space-y-3">
                  {incomeRecurring.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {getCategoryName(item.category_id)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Account: {getBankName(item.bank_id)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Date: {currentMonth} {currentYear}
                          </div>
                          {item.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            ₹{item.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAddToMonth(item.id)}
                          disabled={addingToMonth === item.id}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          <Calendar className="h-4 w-4" />
                          {addingToMonth === item.id
                            ? 'Adding...'
                            : `Add to ${currentMonth} ${currentYear}`}
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recurring income transactions yet</p>
              )}
            </div>

            {/* Recurring Expenses */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-red-600">
                Recurring Expenses ({expenseRecurring.length})
              </h3>
              {expenseRecurring.length > 0 ? (
                <div className="space-y-3">
                  {expenseRecurring.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {getCategoryName(item.category_id)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Account: {getBankName(item.bank_id)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Date: {currentMonth} {currentYear}
                          </div>
                          {item.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-red-600">
                            ₹{item.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAddToMonth(item.id)}
                          disabled={addingToMonth === item.id}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          <Calendar className="h-4 w-4" />
                          {addingToMonth === item.id
                            ? 'Adding...'
                            : `Add to ${currentMonth} ${currentYear}`}
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recurring expense transactions yet</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

