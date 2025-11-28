'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Holdings() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to consolidated portfolio page
    router.push('/portfolio');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-600">Redirecting to consolidated portfolio...</p>
        </div>
      </div>
    </div>
  );
}

