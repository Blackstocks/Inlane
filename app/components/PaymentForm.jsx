// app/components/PaymentForm.tsx
'use client';
import { useState } from 'react';

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

  // In PaymentForm.tsx, update the handleSubmit function:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const requestData = {
      amount: parseFloat(formData.amount),
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      userData: {
        name: formData.customerName,
        email: formData.customerEmail,
        phone: formData.customerPhone,
      }
    };
    
    console.log('Sending payment request:', requestData);
    
    const response = await fetch('/api/payment/create-route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    // Debug the response
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
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
      submitToPaymentGateway(data);
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


  const submitToPaymentGateway = (paymentData: any) => {
    console.log('Submitting to gateway:', paymentData);
    
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentData.gatewayURL;
    
    // Add all form data fields
    Object.entries(paymentData.formData).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value as string;
      form.appendChild(input);
      console.log(`Adding field: ${key} = ${value}`);
    });
    
    document.body.appendChild(form);
    form.submit();
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (paymentInProgress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ecffbd] via-white to-[#d9ff7a] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00c281] mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-[#2e3cff] mb-2">Processing Payment</h2>
          <p className="text-[#6257ff]">Please wait while we redirect you to the payment gateway...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecffbd] via-white to-[#d9ff7a] flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-[#2e3cff] mb-6 text-center">Payment Form</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
              Name (Required)
            </label>
            <input
              type="text"
              id="customerName"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00c281]"
              required
            />
          </div>
          
          <div>
            <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Email (Required)
            </label>
            <input
              type="email"
              id="customerEmail"
              value={formData.customerEmail}
              onChange={(e) => handleInputChange('customerEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00c281]"
              required
            />
          </div>
          
          <div>
            <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="customerPhone"
              value={formData.customerPhone}
              onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00c281]"
            />
          </div>
          
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              id="amount"
              min="1"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00c281]"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#00c281] text-white py-2 px-4 rounded-md hover:bg-[#00a86b] focus:outline-none focus:ring-2 focus:ring-[#00c281] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </form>
      </div>
    </div>
  );
}
