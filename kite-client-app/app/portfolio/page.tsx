'use client';

import { useEffect, useState } from 'react';
import { useKiteStore } from '@/store/useKiteStore';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function ConsolidatedPortfolio() {
  const router = useRouter();
  const { 
    consolidated, 
    isLoading, 
    error, 
    fetchAllAccountsData,
    availableAccounts,
    isDataHidden,
    toggleDataVisibility
  } = useKiteStore();

  const [expandedHolding, setExpandedHolding] = useState<string | null>(null);
  const [expandedMF, setExpandedMF] = useState<string | null>(null);

  useEffect(() => {
    fetchAllAccountsData();
  }, []);

  // Helper function to mask sensitive data
  const maskData = (value: number) => {
    return isDataHidden ? '****' : `₹${value.toFixed(2)}`;
  };

  const maskPercent = (value: number) => {
    return isDataHidden ? '****' : `${value.toFixed(2)}%`;
  };

  const maskQuantity = (value: number, decimals: number = 0) => {
    return isDataHidden ? '****' : value.toFixed(decimals);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading portfolio data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Family Portfolio</h1>
            <p className="text-gray-600 mt-1">
              Consolidated view across {availableAccounts.length} account(s)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDataVisibility}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
              title={isDataHidden ? "Show Data" : "Hide Data"}
            >
              {isDataHidden ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span>Show Data</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>Hide Data</span>
                </>
              )}
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Investment</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {maskData(consolidated.totalInvestment)}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Current Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {maskData(consolidated.totalValue)}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total P&L</p>
            <p className={`text-2xl font-bold mt-2 ${consolidated.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {maskData(consolidated.totalPnL)}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Returns</p>
            <p className={`text-2xl font-bold mt-2 ${consolidated.totalPnLPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {maskPercent(consolidated.totalPnLPercentage)}
            </p>
          </div>
        </div>

        {/* Equity Holdings */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Equity Holdings ({consolidated.holdings.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900">Symbol</th>
                  <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Qty</th>
                  <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Avg. Price</th>
                  <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">LTP</th>
                  <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Investment</th>
                  <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Current Value</th>
                  <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">P&L</th>
                  <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Returns %</th>
                  <th className="px-3 py-3.5 pr-6 text-center text-sm font-semibold text-gray-900">Accounts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {consolidated.holdings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      No equity holdings found
                    </td>
                  </tr>
                ) : (
                  consolidated.holdings.map((holding) => {
                    const key = `${holding.exchange}:${holding.tradingsymbol}`;
                    const isExpanded = expandedHolding === key;
                    
                    return (
                      <>
                        <tr key={key} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900">
                            {holding.tradingsymbol}
                            <span className="text-xs text-gray-500 ml-2">{holding.exchange}</span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-700">
                            {maskQuantity(holding.totalQuantity, 0)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-700">
                            {maskData(holding.averagePrice)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-700">
                            {maskData(holding.currentPrice)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-700">
                            {maskData(holding.investmentValue)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-700">
                            {maskData(holding.currentValue)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-4 text-sm text-right font-medium ${holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {maskData(holding.pnl)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-4 text-sm text-right font-medium ${holding.pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {maskPercent(holding.pnlPercentage)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 pr-6 text-center">
                            <button
                              onClick={() => setExpandedHolding(isExpanded ? null : key)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              {holding.accounts.length} {isExpanded ? '▲' : '▼'}
                            </button>
                          </td>
                        </tr>
                        
                        {isExpanded && (
                          <tr>
                            <td colSpan={9} className="bg-gray-50 px-6 py-4">
                              <div className="space-y-2">
                                <p className="text-sm font-semibold text-gray-700">Account Breakdown:</p>
                                {holding.accounts.map((acc) => (
                                  <div key={acc.id} className="flex justify-between items-center text-sm text-gray-600 pl-4">
                                    <span className="font-medium">{acc.name}</span>
                                    <div className="flex gap-4">
                                      <span>Qty: {maskQuantity(acc.quantity, 0)}</span>
                                      <span>Avg: {maskData(acc.averagePrice)}</span>
                                      <span className={acc.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        P&L: {maskData(acc.pnl)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mutual Fund Holdings */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Mutual Fund Holdings ({consolidated.mfHoldings.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900">Fund</th>
                  <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Units</th>
                  <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Avg. NAV</th>
                  <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Current NAV</th>
                  <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Investment</th>
                  <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Current Value</th>
                  <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">P&L</th>
                  <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Returns %</th>
                  <th className="px-3 py-3.5 pr-6 text-center text-sm font-semibold text-gray-900">Accounts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {consolidated.mfHoldings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      No mutual fund holdings found
                    </td>
                  </tr>
                ) : (
                  consolidated.mfHoldings.map((mf) => {
                    const isExpanded = expandedMF === mf.tradingsymbol;
                    
                    return (
                      <>
                        <tr key={mf.tradingsymbol} className="hover:bg-gray-50">
                          <td className="py-4 pl-6 pr-3 text-sm text-gray-900">
                            <div className="font-medium">{mf.fund}</div>
                            <div className="text-xs text-gray-500">{mf.tradingsymbol}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-700">
                            {maskQuantity(mf.totalQuantity, 3)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-700">
                            {maskData(mf.averagePrice)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-700">
                            {maskData(mf.currentPrice)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-700">
                            {maskData(mf.investmentValue)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-700">
                            {maskData(mf.currentValue)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-4 text-sm text-right font-medium ${mf.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {maskData(mf.pnl)}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-4 text-sm text-right font-medium ${mf.pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {maskPercent(mf.pnlPercentage)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 pr-6 text-center">
                            <button
                              onClick={() => setExpandedMF(isExpanded ? null : mf.tradingsymbol)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              {mf.accounts.length} {isExpanded ? '▲' : '▼'}
                            </button>
                          </td>
                        </tr>
                        
                        {isExpanded && (
                          <tr>
                            <td colSpan={9} className="bg-gray-50 px-6 py-4">
                              <div className="space-y-2">
                                <p className="text-sm font-semibold text-gray-700">Account Breakdown:</p>
                                {mf.accounts.map((acc) => (
                                  <div key={acc.id} className="flex justify-between items-center text-sm text-gray-600 pl-4">
                                    <span className="font-medium">{acc.name}</span>
                                    <div className="flex gap-4">
                                      <span>Units: {maskQuantity(acc.quantity, 3)}</span>
                                      <span>Avg NAV: {maskData(acc.averagePrice)}</span>
                                      <span className={acc.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        P&L: {maskData(acc.pnl)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

