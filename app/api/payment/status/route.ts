import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, amount } = body;

    const requestData = {
      merchantID: process.env.PAYMENT_GATEWAY_MERCHANT_ID!,
      merchantTxnNo: transactionId,
      originalTxnNo: transactionId,
      transactionType: 'STATUS',
      aggregatorID: 'J_03345',
      amount: amount
    };

    const hashString = Object.values(requestData).join('');
    const secureHash = crypto
      .createHmac('sha256', process.env.PAYMENT_GATEWAY_AGGREGATOR_SECRET!)
      .update(hashString, 'ascii')
      .digest('hex');

    const formData = new URLSearchParams({
      ...requestData,
      secureHash
    });

    const response = await fetch(process.env.PAYMENT_GATEWAY_COMMAND_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Status check failed'
    }, { status: 500 });
  }
}
