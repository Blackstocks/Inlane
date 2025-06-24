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
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
