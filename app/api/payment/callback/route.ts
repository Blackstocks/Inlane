import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  console.log('PG Callback Received:', Object.fromEntries(formData.entries()));

  const responseCode = formData.get('responseCode');
  const merchantTxnNo = formData.get('merchantTxnNo');

  if (responseCode === '000' || responseCode === '0000') {
    return NextResponse.redirect('/payment/success');
  } else {
    return NextResponse.redirect('/payment/failure');
  }
}
