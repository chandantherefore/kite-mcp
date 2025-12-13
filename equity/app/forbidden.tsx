import Link from 'next/link';
import { Shield, Home, ArrowLeft } from 'lucide-react';

export default function Forbidden() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-6xl font-bold text-gray-300">403</h1>
          <h2 className="text-3xl font-bold text-gray-900 mt-4">Forbidden</h2>
          <p className="text-gray-600 mt-2">
            You don't have permission to access this resource.
          </p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Link>
        </div>
      </div>
    </div>
  );
}

