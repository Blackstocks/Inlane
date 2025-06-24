import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
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

    // Determine success/failure
    const isSuccess = responseCode === 'R1000' || responseCode === 'SUCCESS';
    
    if (isSuccess) {
      const successUrl = new URL('/payment/success', request.url);
      successUrl.searchParams.set('transactionId', merchantTxnNo || '');
      successUrl.searchParams.set('amount', amount || '');
      return NextResponse.redirect(successUrl);
    } else {
      const failureUrl = new URL('/payment/failure', request.url);
      failureUrl.searchParams.set('transactionId', merchantTxnNo || '');
      failureUrl.searchParams.set('error', responseCode || 'Payment failed');
      return NextResponse.redirect(failureUrl);
    }
  } catch (error) {
    console.error('Payment callback error:', error);
    const failureUrl = new URL('/payment/failure', request.url);
    failureUrl.searchParams.set('error', 'Callback processing failed');
    return NextResponse.redirect(failureUrl);
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
