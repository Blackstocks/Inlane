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

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    const paymentRequest = {
      amount,
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
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
