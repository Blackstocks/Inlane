'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PaymentFailure() {
  const searchParams = useSearchParams();
  const [transactionId, setTransactionId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  useEffect(() => {
    const txnId = searchParams.get('transactionId') || 
                  localStorage.getItem('currentTransactionId') || '';
    const errorMsg = searchParams.get('error') || 'Payment failed';
    const paymentAmount = localStorage.getItem('paymentAmount') || '';
    
    setTransactionId(txnId);
    setError(errorMsg);
    setAmount(paymentAmount);

    // Clear localStorage
    localStorage.removeItem('currentTransactionId');
    localStorage.removeItem('paymentAmount');
  }, [searchParams]);

  const handleRetryPayment = () => {
    // Redirect back to payment form
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecffbd] via-white to-[#d9ff7a] flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
        {/* Failure Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <svg 
            className="h-8 w-8 text-red-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Payment Failed
        </h1>
        
        <p className="text-gray-600 mb-6">
          We couldn&apos;t process your payment. Please try again.
        </p>

        {/* Error Details */}
        <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-red-800 mb-2">Error Details</h3>
          <div className="space-y-2 text-sm">
            {transactionId && (
              <div className="flex justify-between">
                <span className="text-red-600">Transaction ID:</span>
                <span className="font-medium text-red-800 break-all">
                  {transactionId}
                </span>
              </div>
            )}
            {/* bug fixed
             */}
            {amount && (
              <div className="flex justify-between">
                <span className="text-red-600">Amount:</span>
                <span className="font-medium text-red-800">₹{amount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-red-600">Status:</span>
              <span className="font-medium text-red-800">Failed</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">Error:</span>
              <span className="font-medium text-red-800 break-words">
                {error}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">Date:</span>
              <span className="font-medium text-red-800">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleRetryPayment}
            className="w-full bg-[#00c281] text-white py-2 px-4 rounded-md hover:bg-[#00a86b] focus:outline-none focus:ring-2 focus:ring-[#00c281] transition-colors duration-200"
          >
            Retry Payment
          </button>
          
          <Link
            href="/"
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200 inline-block"
          >
            Back to Home
          </Link>
        </div>

        {/* Support Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">
            Need help? Contact our support team
          </p>
          <p className="text-sm text-[#00c281] font-medium">
            support@yourcompany.com
          </p>
        </div>
      </div>
    </div>
  );
}