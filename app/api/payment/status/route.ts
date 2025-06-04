import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { txnRefNo } = await request.json();
    
    if (!txnRefNo) {
      return NextResponse.json({ error: 'Transaction reference number is required' }, { status: 400 });
    }

    // Prepare status check parameters
    const statusParams = {
      MerchantId: process.env.PAYMENT_MERCHANT_ID,
      TerminalId: process.env.PAYMENT_TERMINAL_ID,
      TxnRefNo: txnRefNo
    };

    // Generate secure hash for status check
    const secureHash = generateStatusHash(statusParams);

    const requestBody = {
      ...statusParams,
      SecureHash: secureHash
    };

    console.log('Status check request:', requestBody);

    // Make request to ICICI status API
    const response = await fetch(process.env.PAYMENT_STATUS_GATEWAY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    console.log('Status check response:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

function generateStatusHash(params: any): string {
  const salt = process.env.PAYMENT_SALT_KEY;
  const sortedKeys = Object.keys(params).sort();
  
  let hashString = salt;
  
  for (const key of sortedKeys) {
    if (params[key] && params[key] !== '') {
      hashString += params[key];
    }
  }
  
  return crypto.createHash('sha256').update(hashString).digest('hex').toUpperCase();
}
