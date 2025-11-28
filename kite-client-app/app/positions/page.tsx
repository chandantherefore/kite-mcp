'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Positions() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard - positions feature can be added later per-account
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    </div>
  );
}
