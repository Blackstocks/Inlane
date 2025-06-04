'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function FailureContent() {
  const searchParams = useSearchParams();
  const txnRefNo = searchParams.get('txnRefNo');
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecffbd] via-white to-[#d9ff7a] flex items-center justify-center px-4">
      <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Failed</h1>
        <p className="text-gray-600 mb-6">
          Your payment could not be processed. Please try again or contact support if the issue persists.
        </p>
        
        {txnRefNo && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Transaction Reference: <strong>{txnRefNo}</strong></p>
          </div>
        )}
        
        <div className="space-y-3">
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-[#00c281] text-white py-3 rounded-xl font-semibold hover:bg-[#00ce84] transition-colors"
          >
            Try Again
          </button>
          
          <button 
            onClick={() => window.location.href = 'mailto:support@inlane.in'}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
          >
            Contact Support
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
