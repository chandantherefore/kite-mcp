'use client';

import { useState, useEffect } from 'react';
import PageShortcuts from '@/components/PageShortcuts';
import { equityLinks } from '@/lib/links';

interface Account {
  id: number;
  name: string;
  broker_id: string | null;
  last_tradebook_sync: string | null;
  last_ledger_sync: string | null;
  tradebook_records_count: number;
  ledger_records_count: number;
}

interface ImportResult {
  success: boolean;
  message?: string;
  imported?: number;
  total?: number;
  errors?: string[];
  error?: string;
}

export default function ImportPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [tradebookFile, setTradebookFile] = useState<File | null>(null);
  const [ledgerFile, setLedgerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [tradebookResult, setTradebookResult] = useState<ImportResult | null>(null);
  const [ledgerResult, setLedgerResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      
      if (data.success) {
        setAccounts(data.accounts);
        
        // Show last sync for selected account
        if (selectedAccount) {
          const account = data.accounts.find((a: Account) => a.id.toString() === selectedAccount);
          if (account) {
            console.log('Last sync:', account);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  const handleTradebookUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccount || !tradebookFile) {
      return;
    }

    setLoading(true);
    setTradebookResult(null);

    try {
      const formData = new FormData();
      formData.append('file', tradebookFile);
      formData.append('accountId', selectedAccount);

      const response = await fetch('/api/import/tradebook', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setTradebookResult(data);
      
      if (data.success) {
        setTradebookFile(null);
        // Reset file input
        const fileInput = document.getElementById('tradebook-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (err: any) {
      setTradebookResult({
        success: false,
        error: 'Failed to upload tradebook',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLedgerUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccount || !ledgerFile) {
      return;
    }

    setLoading(true);
    setLedgerResult(null);

    try {
      const formData = new FormData();
      formData.append('file', ledgerFile);
      formData.append('accountId', selectedAccount);

      const response = await fetch('/api/import/ledger', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setLedgerResult(data);
      
      if (data.success) {
        setLedgerFile(null);
        // Reset file input
        const fileInput = document.getElementById('ledger-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (err: any) {
      setLedgerResult({
        success: false,
        error: 'Failed to upload ledger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageShortcuts links={equityLinks} title="Equity" />
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Data</h1>
          <p className="text-gray-700">Upload Tradebook and Ledger CSV files from Zerodha</p>
        </div>

        {accounts.length === 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              No accounts found. Please{' '}
              <a href="/settings/accounts" className="underline font-semibold">
                add an account
              </a>{' '}
              first before importing data.
            </p>
          </div>
        )}

        {/* Account Selection */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Select Account</h2>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={accounts.length === 0}
          >
            <option value="">-- Select an account --</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} {account.broker_id && `(${account.broker_id})`}
              </option>
            ))}
          </select>
          
          {selectedAccount && accounts.find(a => a.id.toString() === selectedAccount) && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Last Sync Information</h3>
              <div className="text-sm text-gray-700 space-y-1">
                {(() => {
                  const account = accounts.find(a => a.id.toString() === selectedAccount);
                  return (
                    <>
                      <p>
                        <span className="font-medium">Tradebook:</span>{' '}
                        {account?.last_tradebook_sync
                          ? `${new Date(account.last_tradebook_sync).toLocaleString()} (${account.tradebook_records_count} records)`
                          : 'Never synced'}
                      </p>
                      <p>
                        <span className="font-medium">Ledger:</span>{' '}
                        {account?.last_ledger_sync
                          ? `${new Date(account.last_ledger_sync).toLocaleString()} (${account.ledger_records_count} records)`
                          : 'Never synced'}
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Tradebook Upload */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Tradebook</h2>
          <p className="text-sm text-gray-700 mb-4">
            CSV file should contain: symbol, isin, trade_date, exchange, segment, series, trade_type, auction, quantity, price, trade_id, order_id, order_execution_time
          </p>
          
          <form onSubmit={handleTradebookUpload}>
            <div className="mb-4">
              <input
                id="tradebook-file"
                type="file"
                accept=".csv"
                onChange={(e) => setTradebookFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={!selectedAccount || loading}
              />
            </div>

            <button
              type="submit"
              disabled={!selectedAccount || !tradebookFile || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Uploading...' : 'Upload Tradebook'}
            </button>
          </form>

          {tradebookResult && (
            <div className={`mt-4 p-4 rounded-lg ${tradebookResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={tradebookResult.success ? 'text-green-800' : 'text-red-800'}>
                {tradebookResult.message || tradebookResult.error}
              </p>
              {tradebookResult.conflicts > 0 && (
                <p className="mt-2 text-yellow-700 text-sm">
                  ⚠️ {tradebookResult.conflicts} conflict(s) detected.{' '}
                  <a href="/conflicts" className="underline font-semibold">
                    View and resolve conflicts
                  </a>
                </p>
              )}
              {tradebookResult.errors && tradebookResult.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-semibold">
                    View {tradebookResult.errors.length} error(s)
                  </summary>
                  <ul className="mt-2 text-sm list-disc list-inside">
                    {tradebookResult.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Ledger Upload */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Ledger</h2>
          <p className="text-sm text-gray-700 mb-4">
            CSV file should contain: particular, posting_date, cost_center, voucher_type, debit, credit, net_balance
          </p>
          
          <form onSubmit={handleLedgerUpload}>
            <div className="mb-4">
              <input
                id="ledger-file"
                type="file"
                accept=".csv"
                onChange={(e) => setLedgerFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={!selectedAccount || loading}
              />
            </div>

            <button
              type="submit"
              disabled={!selectedAccount || !ledgerFile || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Uploading...' : 'Upload Ledger'}
            </button>
          </form>

          {ledgerResult && (
            <div className={`mt-4 p-4 rounded-lg ${ledgerResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={ledgerResult.success ? 'text-green-800' : 'text-red-800'}>
                {ledgerResult.message || ledgerResult.error}
              </p>
              {ledgerResult.conflicts > 0 && (
                <p className="mt-2 text-yellow-700 text-sm">
                  ⚠️ {ledgerResult.conflicts} conflict(s) detected.{' '}
                  <a href="/conflicts" className="underline font-semibold">
                    View and resolve conflicts
                  </a>
                </p>
              )}
              {ledgerResult.errors && ledgerResult.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-semibold">
                    View {ledgerResult.errors.length} error(s)
                  </summary>
                  <ul className="mt-2 text-sm list-disc list-inside">
                    {ledgerResult.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Tips:</h3>
          <ul className="text-sm text-blue-900 list-disc list-inside space-y-1">
            <li>Export your Tradebook and Ledger from Zerodha Console</li>
            <li>Ensure CSV files are in the correct format</li>
            <li>Upload data for each account separately</li>
            <li>Duplicate entries will be handled automatically</li>
            <li>For accurate XIRR, upload both Tradebook and Ledger data</li>
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
}

