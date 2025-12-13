'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function KiteAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const requestToken = searchParams.get('request_token');
    const status = searchParams.get('status');
    const action = searchParams.get('action');

    // Check if we have the necessary parameters
    if (requestToken && status === 'success') {
      // Redirect back to accounts page with the parameters
      router.push(`/settings/accounts?request_token=${requestToken}&status=${status}`);
    } else {
      // If authentication failed or parameters are missing
      console.error('Kite authentication failed or missing parameters');
      router.push('/settings/accounts?error=auth_failed');
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
        <p className="text-gray-700">Completing authentication...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we redirect you back.</p>
      </div>
    </div>
  );
}

