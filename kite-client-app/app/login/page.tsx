'use client';

import { useRouter } from 'next/navigation';
import { Key } from 'lucide-react';

export default function Login() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Key className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Multi-Account Portfolio
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Consolidated family portfolio dashboard
          </p>
        </div>
        
        <div className="mt-8 space-y-6 rounded-lg bg-white p-8 shadow">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Setup Instructions</h3>
            
            <div className="text-sm text-gray-600 space-y-2">
              <p>1. Configure your accounts in <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code>:</p>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
{`KITE_ACC_1_ID=father
KITE_ACC_1_NAME=Dad's Portfolio
KITE_ACC_1_KEY=your_api_key
KITE_ACC_1_SECRET=your_api_secret`}
              </pre>
              
              <p>2. Rebuild the server:</p>
              <pre className="bg-gray-50 p-3 rounded text-xs">npm run build</pre>
              
              <p>3. Authenticate via MCP server (Claude Desktop):</p>
              <pre className="bg-gray-50 p-3 rounded text-xs">
{`Tool: login
Args: { client_id: "father" }`}
              </pre>
              
              <p>4. Once authenticated, return to this dashboard to view your portfolio.</p>
            </div>
          </div>
          
          <div className="pt-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Dashboard
            </button>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              For detailed setup instructions, see <code>MULTI_ACCOUNT_SETUP.md</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
