'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  authenticated: boolean;
  loginUrl?: string;
}

export default function KiteAuthPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
    
    // Check if we have a request_token in URL (OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const requestToken = urlParams.get('request_token');
    const status = urlParams.get('status');
    
    if (requestToken && status === 'success') {
      // Store in sessionStorage to complete auth after page loads
      sessionStorage.setItem('kite_request_token', requestToken);
    }
  }, []);

  useEffect(() => {
    // Complete authentication if we have a request token
    const requestToken = sessionStorage.getItem('kite_request_token');
    if (requestToken && accounts.length > 0) {
      completeAuth(requestToken);
      sessionStorage.removeItem('kite_request_token');
    }
  }, [accounts]);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get available accounts
      const accountsRes = await fetch('/api/kite/accounts');
      const accountsData = await accountsRes.json();

      if (accountsData.error) {
        setError(accountsData.error);
        setAccounts([]);
        return;
      }

      // Check authentication status for each
      const accountsList = accountsData.accounts || [];
      const accountsWithStatus = await Promise.all(
        accountsList.map(async (acc: any) => {
          try {
            const profileRes = await fetch('/api/kite/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tool: 'get_profile',
                args: { client_id: acc.id }
              })
            });
            
            const profileData = await profileRes.json();
            
            return {
              id: acc.id,
              name: acc.name,
              authenticated: !profileData.error && profileData.user_id,
            };
          } catch {
            return {
              id: acc.id,
              name: acc.name,
              authenticated: false,
            };
          }
        })
      );

      setAccounts(accountsWithStatus);
    } catch (err: any) {
      setError(err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const startAuth = async (accountId: string) => {
    setAuthLoading(accountId);
    setError(null);

    try {
      const response = await fetch('/api/kite/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'login',
          args: { client_id: accountId }
        })
      });

      const result = await response.json();

      if (result.error) {
        setError(`Error for ${accountId}: ${result.error}`);
        setAuthLoading(null);
        return;
      }

      if (result.loginUrl) {
        // Store which account we're authenticating
        sessionStorage.setItem('kite_auth_account', accountId);
        
        // Redirect to Kite login
        window.location.href = result.loginUrl;
      }
    } catch (err: any) {
      setError(`Failed to start auth for ${accountId}: ${err.message}`);
      setAuthLoading(null);
    }
  };

  const completeAuth = async (requestToken: string) => {
    const accountId = sessionStorage.getItem('kite_auth_account');
    
    if (!accountId) {
      setError('Cannot determine which account to authenticate');
      return;
    }

    try {
      const response = await fetch('/api/kite/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'generate_session',
          args: {
            client_id: accountId,
            request_token: requestToken
          }
        })
      });

      const result = await response.json();

      if (result.error) {
        setError(`Authentication failed: ${result.error}`);
      } else {
        // Success! Reload to update status
        sessionStorage.removeItem('kite_auth_account');
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Reload accounts
        await loadAccounts();
        
        alert(`Successfully authenticated ${accountId}!`);
      }
    } catch (err: any) {
      setError(`Failed to complete auth: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Zerodha Kite Authentication
          </h1>
          <p className="text-gray-600">
            Authenticate your Zerodha accounts to enable live trading data
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Authentication tokens expire daily - you'll need to re-authenticate each day</li>
                <li>Make sure you have Kite Connect API credentials configured in .env.local</li>
                <li>Click "Authenticate" to be redirected to Zerodha's login page</li>
                <li>After logging in, you'll be redirected back here automatically</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Error:</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading accounts...</span>
          </div>
        )}

        {/* No Accounts */}
        {!loading && accounts.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">No Kite accounts configured</p>
            <div className="text-sm text-gray-500 text-left max-w-2xl mx-auto">
              <p className="mb-2">To add accounts, create/update <code className="bg-gray-100 px-2 py-1 rounded">kite-client-app/.env.local</code>:</p>
              <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto text-xs">
{`# Account 1
KITE_ACC_1_ID=account1
KITE_ACC_1_NAME=Your Name
KITE_ACC_1_KEY=your_api_key
KITE_ACC_1_SECRET=your_api_secret

# Account 2
KITE_ACC_2_ID=account2
KITE_ACC_2_NAME=Family Member
KITE_ACC_2_KEY=their_api_key
KITE_ACC_2_SECRET=their_api_secret`}
              </pre>
              <p className="mt-4">Then restart the server:</p>
              <code className="bg-gray-800 text-green-400 px-2 py-1 rounded">ddev exec "supervisorctl restart webextradaemons:nextjs"</code>
            </div>
          </div>
        )}

        {/* Accounts List */}
        {!loading && accounts.length > 0 && (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    {account.authenticated ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-gray-400" />
                    )}

                    {/* Account Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {account.name}
                      </h3>
                      <p className="text-sm text-gray-600">ID: {account.id}</p>
                      <div className="mt-1">
                        {account.authenticated ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            ✓ Authenticated
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            Not Authenticated
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {account.authenticated ? (
                      <button
                        onClick={() => startAuth(account.id)}
                        disabled={authLoading === account.id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2"
                      >
                        {authLoading === account.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            <span>Re-authenticate</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => startAuth(account.id)}
                        disabled={authLoading === account.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-2"
                      >
                        {authLoading === account.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4" />
                            <span>Authenticate</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        {accounts.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={loadAccounts}
              disabled={loading}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <a
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 hover:underline"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

