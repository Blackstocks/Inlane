'use client';
import { useState } from 'react';
import { CreditCard, User, Mail, Phone, IndianRupee, Lock, Shield, CheckCircle } from 'lucide-react';

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: string;
}

export default function PaymentForm() {
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    amount: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Prevent submission if required fields are empty
    if (!formData.customerName || !formData.customerEmail || !formData.amount) {
      alert('Please fill in all required fields.');
      return;
    }
    
    setLoading(true);
    
    try {
      const requestData = {
        amount: parseFloat(formData.amount),
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
      };
      
      console.log('Sending payment request:', requestData);
      
      const response = await fetch('/api/payment/create-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        console.error('Response was:', responseText);
        alert('Server returned invalid response. Check console for details.');
        return;
      }
      
      console.log('Parsed payment response:', data);
      
      if (data.success) {
        setPaymentInProgress(true);
        
        // Store transaction details in sessionStorage for callback handling
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('currentTransactionId', data.transactionId);
          sessionStorage.setItem('paymentAmount', formData.amount);
        }
        
        // Small delay to show loading state
        setTimeout(() => {
          // Redirect to payment gateway
          window.location.href = data.redirectUrl;
        }, 1000);
      } else {
        alert('Failed to create payment order: ' + (data.error || 'Unknown error'));
        console.error('Payment creation failed:', data);
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);
      alert('Payment initiation failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (paymentInProgress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center px-4">
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-12 text-center max-w-md w-full border border-green-100/50">
          <div className="relative mb-8">
            {/* Road Animation */}
            <div className="relative w-32 h-32 mx-auto">
              {/* Road */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                {/* Road lines */}
                <div className="absolute inset-0 flex flex-col justify-center items-center">
                  <div className="w-1 h-6 bg-white animate-pulse opacity-80"></div>
                  <div className="w-1 h-6 bg-white animate-pulse opacity-60 mt-2"></div>
                  <div className="w-1 h-6 bg-white animate-pulse opacity-40 mt-2"></div>
                </div>
              </div>
              
              {/* Car */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="animate-bounce">
                  <div className="w-8 h-5 bg-gradient-to-r from-green-500 to-green-600 rounded-lg relative shadow-lg">
                    {/* Car body */}
                    <div className="absolute -top-1 left-1 w-6 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-t-lg"></div>
                    {/* Headlights */}
                    <div className="absolute -left-0.5 top-1 w-1 h-1 bg-yellow-300 rounded-full animate-pulse"></div>
                    <div className="absolute -left-0.5 top-3 w-1 h-1 bg-yellow-300 rounded-full animate-pulse"></div>
                    {/* Wheels */}
                    <div className="absolute -bottom-1 left-0 w-2 h-2 bg-gray-800 rounded-full animate-spin"></div>
                    <div className="absolute -bottom-1 right-0 w-2 h-2 bg-gray-800 rounded-full animate-spin"></div>
                  </div>
                </div>
              </div>
              
              {/* Speed lines */}
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div className="absolute top-1/4 right-4 w-4 h-0.5 bg-green-300 animate-pulse opacity-60"></div>
                <div className="absolute top-1/2 right-3 w-6 h-0.5 bg-green-400 animate-pulse opacity-70"></div>
                <div className="absolute top-3/4 right-4 w-4 h-0.5 bg-green-300 animate-pulse opacity-60"></div>
              </div>
            </div>
            
            {/* Rotating outer ring */}
            <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
          </div>
          
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent mb-4">
            Processing Payment
          </h2>
          <p className="text-gray-600 mb-6 text-lg">Taking you to secure payment gateway...</p>
          
          {/* Progress bar */}
          <div className="w-full bg-green-100 rounded-full h-2 mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full animate-pulse w-3/4"></div>
          </div>
          
          <div className="space-y-3 text-sm text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Secured by PhiCommerce</span>
            </div>
            <p className="text-red-500 font-medium">⚠️ Do not close this window</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl mb-4 shadow-lg shadow-green-200">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Secure Payment
          </h1>
          <p className="text-gray-600">Enter your details to proceed with payment</p>
        </div>

        {/* Payment Form */}
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl shadow-green-100/50 p-8 border border-green-100/30">
          <div className="space-y-6">
            {/* Customer Name */}
            <div className="space-y-2">
              <label htmlFor="customerName" className="block text-sm font-semibold text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                  focusedField === 'customerName' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  onFocus={() => setFocusedField('customerName')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-green-50/30 hover:bg-white focus:bg-white"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="customerEmail" className="block text-sm font-semibold text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                  focusedField === 'customerEmail' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <input
                  type="email"
                  id="customerEmail"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  onFocus={() => setFocusedField('customerEmail')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-green-50/30 hover:bg-white focus:bg-white"
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label htmlFor="customerPhone" className="block text-sm font-semibold text-gray-700">
                Phone Number <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                  focusedField === 'customerPhone' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <input
                  type="tel"
                  id="customerPhone"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  onFocus={() => setFocusedField('customerPhone')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-green-50/30 hover:bg-white focus:bg-white"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-semibold text-gray-700">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <IndianRupee className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                  focusedField === 'amount' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <input
                  type="number"
                  id="amount"
                  min="1"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  onFocus={() => setFocusedField('amount')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-green-50/30 hover:bg-white focus:bg-white text-xl font-semibold"
                  placeholder="0.00"
                  required
                />
              </div>
              {formData.amount && (
                <p className="text-sm text-gray-600 mt-1">
                  Amount: ₹{parseFloat(formData.amount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="button" 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg shadow-green-200/50 hover:shadow-xl hover:shadow-green-200/60 transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <Lock className="w-5 h-5" />
                  Pay Now
                </div>
              )}
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Your payment is secured with 256-bit SSL encryption</span>
            </div>
            <div className="flex items-center justify-center gap-6 mt-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>PCI Compliant</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Bank Grade Security</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}