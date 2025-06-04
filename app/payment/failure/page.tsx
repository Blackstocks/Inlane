// app/payment/failure/page.tsx
'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function FailureContent() {
  const searchParams = useSearchParams();
  const txnRef = searchParams.get('ref');
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecffbd] via-white to-[#d9ff7a] flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
        <div className="text-red-500 text-6xl mb-4">✗</div>
        <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Failed</h1>
        <p className="text-gray-600 mb-4">
          {error ? decodeURIComponent(error) : 'Your payment could not be processed.'}
        </p>
        {txnRef && (
          <p className="text-sm text-gray-500 mb-4">
            Transaction Reference: <span className="font-mono">{txnRef}</span>
          </p>
        )}
        <div className="space-y-2">
          <button 
            onClick={() => window.history.back()}
            className="w-full bg-[#00c281] text-white py-2 px-6 rounded-md hover:bg-[#00a86b] mb-2"
          >
            Try Again
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-500 text-white py-2 px-6 rounded-md hover:bg-gray-600"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailure() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FailureContent />
    </Suspense>
  );
}
