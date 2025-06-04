'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const txnRefNo = searchParams.get('txnRefNo');
  const amount = searchParams.get('amount');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecffbd] via-white to-[#d9ff7a] flex items-center justify-center px-4">
      <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your payment has been processed successfully. We will contact you soon to schedule your driving lessons.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">Transaction Reference: <strong>{txnRefNo}</strong></p>
          {amount && <p className="text-sm text-gray-600">Amount Paid: <strong>₹{amount}</strong></p>}
        </div>
        
        <button 
          onClick={() => window.location.href = '/'}
          className="w-full bg-[#00c281] text-white py-3 rounded-xl font-semibold hover:bg-[#00ce84] transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
