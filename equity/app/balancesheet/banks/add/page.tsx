'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X } from 'lucide-react';
import Link from 'next/link';
import PageShortcuts from '@/components/PageShortcuts';
import { DollarSign, Tag, Building2, TrendingUp, TrendingDown, Repeat } from 'lucide-react';

const balanceSheetLinks = [
  { href: '/balancesheet', label: 'Dashboard', icon: DollarSign },
  { href: '/balancesheet/categories', label: 'Categories', icon: Tag },
  { href: '/balancesheet/banks', label: 'Banks', icon: Building2 },
  { href: '/balancesheet/income', label: 'Income', icon: TrendingUp },
  { href: '/balancesheet/expenses', label: 'Expenses', icon: TrendingDown },
  { href: '/balancesheet/recurring', label: 'Recurring', icon: Repeat },
];

export default function AddBankPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    ifsc_code: '',
    account_name: '',
    account_number: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/balancesheet/banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          balance: parseFloat(formData.balance) || 0,
          ifsc_code: formData.ifsc_code || null,
          account_name: formData.account_name || null,
          account_number: formData.account_number || null,
        }),
      });
      const result = await response.json();
      if (result.success) {
        router.push('/balancesheet/banks');
      } else {
        alert(result.error || 'Failed to create bank');
      }
    } catch (err) {
      console.error('Error saving bank:', err);
      alert('Failed to save bank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageShortcuts links={balanceSheetLinks} title="Balance Sheet" />
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Add New Bank
            </h1>
            <Link
              href="/balancesheet/banks"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Back to Banks
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. HDFC Bank"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Balance *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IFSC Code (Optional)
              </label>
              <input
                type="text"
                value={formData.ifsc_code}
                onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. HDFC0001234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name (Optional)
              </label>
              <input
                type="text"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number (Optional)
              </label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 1234567890"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : 'Create Bank'}
              </button>
              <Link
                href="/balancesheet/banks"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}



