// app/api/payment/create-route/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { phiCommerceGateway } from '@/lib/paymentGateway';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received payment request:', body);

    // Validate required fields
    if (!body.amount || !body.customerName || !body.customerEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: amount, customerName, customerEmail' 
        },
        { status: 400 }
      );
    }

    // Validate amount
    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid amount' 
        },
        { status: 400 }
      );
    }

    // Get the base URL for return URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    const paymentRequest = {
      amount: amount,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone || '',
      returnUrl: `${baseUrl}/payment/callback`
    };

    console.log('Initiating payment with PhiCommerce:', paymentRequest);

    const result = await phiCommerceGateway.initiatePayment(paymentRequest);

    console.log('PhiCommerce result:', result);

    if (result.success) {
      return NextResponse.json({
        success: true,
        transactionId: result.transactionId,
        redirectUrl: result.redirectUrl
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// app/api/payment/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract parameters from the callback URL
    const responseCode = searchParams.get('responseCode');
    const merchantTxnNo = searchParams.get('merchantTxnNo');
    const amount = searchParams.get('amount');
    const txnDate = searchParams.get('txnDate');
    const secureHash = searchParams.get('secureHash');
    
    console.log('Payment callback received:', {
      responseCode,
      merchantTxnNo,
      amount,
      txnDate,
      secureHash
    });

    // Determine success/failure based on response code
    const isSuccess = responseCode === 'R1000' || responseCode === 'SUCCESS';
    
    if (isSuccess) {
      // Redirect to success page with transaction details
      const successUrl = new URL('/payment/success', request.url);
      successUrl.searchParams.set('transactionId', merchantTxnNo || '');
      successUrl.searchParams.set('amount', amount || '');
      
      return NextResponse.redirect(successUrl);
    } else {
      // Redirect to failure page with error details
      const failureUrl = new URL('/payment/failure', request.url);
      failureUrl.searchParams.set('transactionId', merchantTxnNo || '');
      failureUrl.searchParams.set('error', responseCode || 'Payment failed');
      
      return NextResponse.redirect(failureUrl);
    }

  } catch (error) {
    console.error('Payment callback error:', error);
    
    // Redirect to failure page on error
    const failureUrl = new URL('/payment/failure', request.url);
    failureUrl.searchParams.set('error', 'Callback processing failed');
    
    return NextResponse.redirect(failureUrl);
  }
}

export async function POST(request: NextRequest) {
  // Handle POST callback if needed
  return GET(request);
}

// app/api/payment/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { phiCommerceGateway } from '@/lib/paymentGateway';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Status check request:', body);

    if (!body.transactionId || !body.amount) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: transactionId, amount' 
        },
        { status: 400 }
      );
    }

    const result = await phiCommerceGateway.checkTransactionStatus(
      body.transactionId,
      body.amount
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}