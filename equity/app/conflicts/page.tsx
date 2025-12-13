'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Check, X, Edit } from 'lucide-react';

interface Conflict {
  id: number;
  account_id: number;
  account_name: string;
  import_type: 'tradebook' | 'ledger';
  conflict_type: string;
  existing_data: any;
  new_data: any;
  conflict_field: string | null;
  status: string;
  created_at: string;
}

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchConflicts();
  }, []);

  const fetchConflicts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/conflicts');
      const data = await response.json();
      
      if (data.success) {
        setConflicts(data.conflicts);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Failed to fetch conflicts');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (conflictId: number, action: string) => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/conflicts/${conflictId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchConflicts();
        setSelectedConflict(null);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Failed to resolve conflict');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (conflictId: number) => {
    if (!confirm('Are you sure you want to delete this conflict?')) {
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/conflicts/${conflictId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchConflicts();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Failed to delete conflict');
    } finally {
      setProcessing(false);
    }
  };

  const renderDataComparison = (conflict: Conflict) => {
    const existing = conflict.existing_data;
    const newData = conflict.new_data;

    if (conflict.import_type === 'tradebook') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-yellow-50 p-4 rounded">
            <h4 className="font-semibold text-sm mb-2">Existing Data</h4>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Symbol:</span> {existing.symbol}</p>
              <p><span className="font-medium">Quantity:</span> {existing.quantity}</p>
              <p><span className="font-medium">Price:</span> ₹{existing.price}</p>
              <p><span className="font-medium">Trade ID:</span> {existing.trade_id}</p>
              <p><span className="font-medium">Date:</span> {new Date(existing.trade_date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-semibold text-sm mb-2">New Data (CSV)</h4>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Symbol:</span> {newData.symbol}</p>
              <p><span className="font-medium">Quantity:</span> {newData.quantity}</p>
              <p><span className="font-medium">Price:</span> ₹{newData.price}</p>
              <p><span className="font-medium">Trade ID:</span> {newData.trade_id}</p>
              <p><span className="font-medium">Date:</span> {newData.trade_date}</p>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-yellow-50 p-4 rounded">
            <h4 className="font-semibold text-sm mb-2">Existing Data</h4>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Date:</span> {new Date(existing.posting_date).toLocaleDateString()}</p>
              <p><span className="font-medium">Particular:</span> {existing.particular}</p>
              <p><span className="font-medium">Debit:</span> ₹{existing.debit}</p>
              <p><span className="font-medium">Credit:</span> ₹{existing.credit}</p>
              <p><span className="font-medium">Balance:</span> ₹{existing.net_balance}</p>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-semibold text-sm mb-2">New Data (CSV)</h4>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Date:</span> {newData.posting_date}</p>
              <p><span className="font-medium">Particular:</span> {newData.particular}</p>
              <p><span className="font-medium">Debit:</span> ₹{newData.debit || 0}</p>
              <p><span className="font-medium">Credit:</span> ₹{newData.credit || 0}</p>
              <p><span className="font-medium">Balance:</span> ₹{newData.net_balance}</p>
            </div>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-gray-700">Loading conflicts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Conflicts</h1>
          <p className="text-gray-700">
            Review and resolve data conflicts detected during CSV imports
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {conflicts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Conflicts Found
            </h2>
            <p className="text-gray-700">
              All your imports are clean! No conflicts to resolve.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6 text-yellow-500" />
                      <div>
                        <h3 className="font-semibold text-lg">
                          {conflict.import_type === 'tradebook' ? 'Tradebook' : 'Ledger'} Conflict
                        </h3>
                        <p className="text-sm text-gray-700">
                          Account: {conflict.account_name} • Type: {conflict.conflict_type}
                        </p>
                        <p className="text-xs text-gray-700 mt-1">
                          Detected: {new Date(conflict.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {renderDataComparison(conflict)}

                  <div className="mt-6 flex gap-2">
                    <button
                      onClick={() => handleResolve(conflict.id, 'keep_existing')}
                      disabled={processing}
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-300 flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Keep Existing
                    </button>
                    <button
                      onClick={() => handleResolve(conflict.id, 'use_new')}
                      disabled={processing}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Use New (CSV)
                    </button>
                    <button
                      onClick={() => handleResolve(conflict.id, 'ignore')}
                      disabled={processing}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300"
                    >
                      Ignore
                    </button>
                    <button
                      onClick={() => handleDelete(conflict.id)}
                      disabled={processing}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 ml-auto"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

