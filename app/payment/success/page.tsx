// app/payment/success/page.tsx
'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const [transactionId, setTransactionId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  useEffect(() => {
    const txnId = searchParams.get('transactionId') || 
                  localStorage.getItem('currentTransactionId') || '';
    const paymentAmount = searchParams.get('amount') || 
                         localStorage.getItem('paymentAmount') || '';
    
    setTransactionId(txnId);
    setAmount(paymentAmount);

    // Clear localStorage
    localStorage.removeItem('currentTransactionId');
    localStorage.removeItem('paymentAmount');
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecffbd] via-white to-[#d9ff7a] flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <svg 
            className="h-8 w-8 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[#2e3cff] mb-4">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your payment has been processed successfully.
        </p>

        {/* Transaction Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-800 mb-2">Transaction Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-medium text-gray-800 break-all">
                {transactionId || 'N/A'}
              </span>
            </div>
            {amount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-gray-800">₹{amount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-green-600">Success</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-800">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/"
            className="w-full bg-[#00c281] text-white py-2 px-4 rounded-md hover:bg-[#00a86b] focus:outline-none focus:ring-2 focus:ring-[#00c281] transition-colors duration-200 inline-block"
          >
            Back to Home
          </Link>
          
          <button
            onClick={() => window.print()}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200"
          >
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

// app/payment/failure/page.tsx
