'use client';

import { useEffect } from 'react';
import { useKiteStore } from '@/store/useKiteStore';
import { useRouter } from 'next/navigation';
import { TrendingUp, Wallet, Briefcase, PieChart, Users, Eye, EyeOff } from 'lucide-react';

export default function Dashboard() {
  const { 
      consolidated,
      fetchAllAccountsData,  
      
      isLoading,
      availableAccounts,
      isDataHidden,
      toggleDataVisibility
  } = useKiteStore();
  
  const router = useRouter();

  useEffect(() => {
      fetchAllAccountsData();
  }, []);

  // Helper function to mask sensitive data
  const maskData = (value: number) => {
    return isDataHidden ? '****' : `₹${value.toLocaleString()}`;
  };

  if (isLoading) {
      return <div className="flex h-screen items-center justify-center">Loading dashboard...</div>;
  }

  const totalPnL = consolidated.totalPnL;
  const totalValue = consolidated.totalValue;
  const totalInvestment = consolidated.totalInvestment;

  return (
      <div className="min-h-screen bg-gray-100">
          <header className="bg-white shadow">
              <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                      Family Portfolio Dashboard
                  </h1>
                  <div className="flex items-center gap-4">
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
                      <div className="text-sm text-gray-500">
                          {availableAccounts.length} Account(s)
                      </div>
                  </div>
              </div>
          </header>
          <main>
              <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                      {/* Stats */}
                      <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                          <div className="flex items-center">
                              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                                  <Wallet className="h-6 w-6 text-green-600" />
                              </div>
                              <div className="ml-5 w-0 flex-1">
                                  <dl>
                                      <dt className="text-sm font-medium text-gray-500 truncate">
                                          Total Investment
                                      </dt>
                                      <dd className="text-lg font-medium text-gray-900">
                                          {maskData(totalInvestment)}
                                      </dd>
                                  </dl>
                              </div>
                          </div>
                      </div>

                      <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                          <div className="flex items-center">
                              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                                  <PieChart className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="ml-5 w-0 flex-1">
                                  <dl>
                                      <dt className="text-sm font-medium text-gray-500 truncate">
                                          Current Value
                                      </dt>
                                      <dd className="text-lg font-medium text-gray-900">
                                          {maskData(totalValue)}
                                      </dd>
                                  </dl>
                              </div>
                          </div>
                      </div>

                      <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                          <div className="flex items-center">
                              <div className={`flex-shrink-0 rounded-md p-3 ${totalPnL >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                  <TrendingUp className={`h-6 w-6 ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                              </div>
                              <div className="ml-5 w-0 flex-1">
                                  <dl>
                                      <dt className="text-sm font-medium text-gray-500 truncate">
                                          Total P&L
                                      </dt>
                                      <dd className={`text-lg font-medium ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {maskData(totalPnL)}
                                      </dd>
                                  </dl>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Quick Links */}
                  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <button 
                        onClick={() => router.push('/portfolio')}
                        className="block p-6 bg-white shadow rounded-lg hover:bg-gray-50 transition"
                      >
                          <h3 className="text-lg font-medium text-gray-900 flex items-center">
                              <Users className="mr-2 h-5 w-5 text-gray-400"/> Consolidated Portfolio
                          </h3>
                          <p className="mt-2 text-sm text-gray-500">
                              View family-wide holdings and mutual funds
                          </p>
                      </button>
                      <button 
                        onClick={() => router.push('/holdings')}
                        className="block p-6 bg-white shadow rounded-lg hover:bg-gray-50 transition"
                      >
                          <h3 className="text-lg font-medium text-gray-900 flex items-center">
                              <Briefcase className="mr-2 h-5 w-5 text-gray-400"/> Holdings
                          </h3>
                          <p className="mt-2 text-sm text-gray-500">
                              View per-account holdings
                          </p>
                      </button>
                      <button 
                        onClick={() => router.push('/positions')}
                        className="block p-6 bg-white shadow rounded-lg hover:bg-gray-50 transition"
                      >
                          <h3 className="text-lg font-medium text-gray-900 flex items-center">
                              <TrendingUp className="mr-2 h-5 w-5 text-gray-400"/> Positions
                          </h3>
                          <p className="mt-2 text-sm text-gray-500">
                              View active trades
                          </p>
                      </button>
                  </div>
              </div>
          </main>
      </div>
  );
}

