'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ExternalLink, RefreshCw, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface Account {
  id: number;
  name: string;
  broker_id: string | null;
  api_key: string | null;
  api_secret: string | null;
  access_token: string | null;
  created_at: string;
  updated_at: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    broker_id: '', 
    api_key: '', 
    api_secret: '' 
  });
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [authLoading, setAuthLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchAccounts();
    
    // Check if we have a request_token in URL (OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const requestToken = urlParams.get('request_token');
    const status = urlParams.get('status');
    const accountId = sessionStorage.getItem('kite_auth_account');
    
    if (requestToken && status === 'success' && accountId) {
      completeAuth(parseInt(accountId), requestToken);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/accounts');
      const data = await response.json();
      
      if (data.success) {
        setAccounts(data.accounts);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const url = editingAccount
        ? `/api/accounts/${editingAccount.id}`
        : '/api/accounts';
      
      const method = editingAccount ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          broker_id: formData.broker_id || null,
          api_key: formData.api_key || null,
          api_secret: formData.api_secret || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchAccounts();
        setShowForm(false);
        setEditingAccount(null);
        setFormData({ name: '', broker_id: '', api_key: '', api_secret: '' });
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Failed to save account');
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      broker_id: account.broker_id || '',
      api_key: account.api_key || '',
      api_secret: '', // Don't show existing secret for security
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account? All associated data will be deleted.')) {
      return;
    }

    try {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchAccounts();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Failed to delete account');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAccount(null);
    setFormData({ name: '', broker_id: '', api_key: '', api_secret: '' });
    setError(null);
    setShowApiSecret(false);
  };

  const startAuth = async (accountId: number) => {
    setAuthLoading(accountId);
    setError(null);

    try {
      const response = await fetch('/api/kite/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          account_id: accountId,
        }),
      });

      const result = await response.json();

      if (result.error) {
        setError(`Error: ${result.error}`);
        setAuthLoading(null);
        return;
      }

      if (result.loginUrl) {
        // Store which account we're authenticating
        sessionStorage.setItem('kite_auth_account', accountId.toString());
        
        // Redirect to Kite login
        window.location.href = result.loginUrl;
      }
    } catch (err: any) {
      setError(`Failed to start auth: ${err.message}`);
      setAuthLoading(null);
    }
  };

  const completeAuth = async (accountId: number, requestToken: string) => {
    try {
      const response = await fetch('/api/kite/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'session',
          account_id: accountId,
          request_token: requestToken,
        }),
      });

      const result = await response.json();

      if (result.error) {
        setError(`Authentication failed: ${result.error}`);
      } else {
        // Success! Reload accounts
        sessionStorage.removeItem('kite_auth_account');
        await fetchAccounts();
        alert(`Successfully authenticated ${accounts.find(a => a.id === accountId)?.name || 'account'}!`);
      }
    } catch (err: any) {
      setError(`Failed to complete auth: ${err.message}`);
    } finally {
      setAuthLoading(null);
    }
  };

  const checkAuthStatus = async (accountId: number) => {
    try {
      const response = await fetch('/api/kite/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'get_profile',
          args: { account_id: accountId },
        }),
      });

      const result = await response.json();
      return !result.error && result.user_id;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Management</h1>
          <p className="text-gray-600">Manage your trading accounts and Kite API credentials</p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Kite API Setup:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Add your Kite Connect API Key and Secret to enable live trading data</li>
                <li>Authentication tokens expire daily - you'll need to re-authenticate each day</li>
                <li>Click "Authenticate" to be redirected to Zerodha's login page</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add New Account
          </button>
        )}

        {showForm && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                  placeholder="e.g., Father, Mother, Self"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Broker ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.broker_id}
                  onChange={(e) => setFormData({ ...formData, broker_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                  placeholder="e.g., ZD1234"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kite API Key (Optional)
                </label>
                <input
                  type="text"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                  placeholder="Your Kite Connect API Key"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from Zerodha Kite Connect dashboard
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kite API Secret (Optional)
                </label>
                <div className="relative">
                  <input
                    type={showApiSecret ? 'text' : 'password'}
                    value={formData.api_secret}
                    onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500 pr-10"
                    placeholder="Your Kite Connect API Secret"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiSecret(!showApiSecret)}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  >
                    {showApiSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Get this from Zerodha Kite Connect dashboard
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingAccount ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Accounts</h2>
            
            {accounts.length === 0 ? (
              <p className="text-gray-600">No accounts yet. Add your first account to get started.</p>
            ) : (
              <div className="space-y-4">
                {accounts.map((account) => {
                  const hasCredentials = !!(account.api_key && account.api_secret);
                  const isAuthenticated = !!account.access_token;
                  
                  return (
                    <div
                      key={account.id}
                      className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Status Icon */}
                          {isAuthenticated ? (
                            <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                          ) : hasCredentials ? (
                            <XCircle className="h-8 w-8 text-yellow-600 flex-shrink-0 mt-1" />
                          ) : (
                            <XCircle className="h-8 w-8 text-gray-400 flex-shrink-0 mt-1" />
                          )}

                          {/* Account Info */}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {account.name}
                            </h3>
                            {account.broker_id && (
                              <p className="text-sm text-gray-600 mt-1">
                                Broker ID: {account.broker_id}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2">
                              {isAuthenticated ? (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Authenticated
                                </span>
                              ) : hasCredentials ? (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Not Authenticated
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                  No API Credentials
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Created: {new Date(account.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(account)}
                            className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                          >
                            Edit
                          </button>
                          {hasCredentials && (
                            <button
                              onClick={() => startAuth(account.id)}
                              disabled={authLoading === account.id}
                              className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${
                                isAuthenticated
                                  ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                              } disabled:bg-gray-100 disabled:text-gray-400`}
                            >
                              {authLoading === account.id ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  <span>Connecting...</span>
                                </>
                              ) : isAuthenticated ? (
                                <>
                                  <RefreshCw className="h-4 w-4" />
                                  <span>Re-authenticate</span>
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="h-4 w-4" />
                                  <span>Authenticate</span>
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(account.id)}
                            className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
