import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabaseClient';

interface PaymentResponse {
  Amount?: string;
  BankId?: string;
  Currency?: string;
  Email?: string;
  FirstName?: string;
  MCC?: string;
  MerchantId?: string;
  MerchantTRID?: string;
  OrderInfo?: string;
  PassCode?: string;
  Phone?: string;
  ReturnURL?: string;
  TerminalId?: string;
  TxnRefNo?: string;
  TxnType?: string;
  Version?: string;
  SecureHash?: string;
  ResponseCode?: string;
  ResponseMessage?: string;
  Message?: string;
  RetRefNo?: string;
  BankRefNo?: string;
  [key: string]: string | undefined;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Callback received');
    
    const formData = await request.formData();
    const encData = formData.get('EncData') as string;
    const merchantId = formData.get('MerchantId') as string;
    const terminalId = formData.get('TerminalId') as string;
    const bankId = formData.get('BankId') as string;

    console.log('Callback data received:', { merchantId, terminalId, bankId, encDataLength: encData?.length });

    if (!encData) {
      throw new Error('No encrypted data received in callback');
    }

    // Decrypt the response
    const decryptedData = decryptDataICICI(encData);
    console.log('Decrypted response:', decryptedData);

    // Verify secure hash
    const isValid = verifySecureHash(decryptedData);
    
    if (!isValid) {
      console.error('Hash verification failed');
      throw new Error('Invalid secure hash - response compromised');
    }

    // Update payment status in database
    await updatePaymentStatus(decryptedData);
    
    // Determine success based on response code
    const isSuccess = decryptedData.ResponseCode === '00' || decryptedData.ResponseCode === '0';
    const redirectUrl = isSuccess 
      ? process.env.PAYMENT_SUCCESS_URL! 
      : process.env.PAYMENT_FAILURE_URL!;

    // Add query parameters for the frontend
    const url = new URL(redirectUrl, process.env.NEXT_PUBLIC_BASE_URL!);
    url.searchParams.set('txnRefNo', decryptedData.TxnRefNo || '');
    url.searchParams.set('status', isSuccess ? 'success' : 'failed');
    url.searchParams.set('amount', decryptedData.Amount || '');
    
    console.log('Redirecting to:', url.toString());
    
    return NextResponse.redirect(url.toString());

  } catch (error) {
    console.error('Callback processing error:', error);
    
    // Redirect to failure page on error
    const failureUrl = new URL(process.env.PAYMENT_FAILURE_URL!, process.env.NEXT_PUBLIC_BASE_URL!);
    failureUrl.searchParams.set('error', 'processing_failed');
    failureUrl.searchParams.set('message', error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.redirect(failureUrl.toString());
  }
}

function decryptDataICICI(encData: string): PaymentResponse {
  try {
    // Get encryption key
    const encryptionKey = process.env.PAYMENT_ENC_KEY!;
    let key = Buffer.from(encryptionKey, 'hex');
    
    // Ensure key is exactly 32 bytes
    if (key.length !== 32) {
      if (key.length < 32) {
        const padding = Buffer.alloc(32 - key.length);
        key = Buffer.concat([key, padding]);
      } else {
        key = key.slice(0, 32);
      }
    }
    
    // Use static IV of zeros (same as encryption)
    const iv = Buffer.alloc(16, 0);
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    decipher.setAutoPadding(true);
    
    // Decrypt the data
    let decrypted = decipher.update(encData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    console.log('Decrypted string:', decrypted.substring(0, 200) + '...');
    
    // Parse the decrypted string (format: key||value::key||value)
    const params: PaymentResponse = {};
    const pairs = decrypted.split('::');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('||');
      if (key && value !== undefined) {
        params[key] = value;
      }
    }
    
    return params;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function verifySecureHash(params: PaymentResponse): boolean {
  try {
    const receivedHash = params.SecureHash;
    if (!receivedHash) {
      console.error('No SecureHash received in response');
      return false;
    }
    
    const calculatedHash = generateSecureHash(params);
    const isValid = receivedHash.toUpperCase() === calculatedHash.toUpperCase();
    
    console.log('Hash verification:', { 
      received: receivedHash.substring(0, 10) + '...', 
      calculated: calculatedHash.substring(0, 10) + '...', 
      valid: isValid 
    });
    
    return isValid;
  } catch (error) {
    console.error('Hash verification error:', error);
    return false;
  }
}

function generateSecureHash(params: PaymentResponse): string {
  const salt = process.env.PAYMENT_SALT_KEY!;
  const sortedKeys = Object.keys(params).filter(key => key !== 'SecureHash').sort();
  
  let hashString = salt;
  
  for (const key of sortedKeys) {
    const value = params[key];
    if (value && value !== '') {
      hashString += value;
    }
  }
  
  return crypto.createHash('sha256').update(hashString).digest('hex').toUpperCase();
}

async function updatePaymentStatus(paymentData: PaymentResponse) {
  try {
    const orderId = paymentData.OrderInfo?.replace('Course_', '');
    
    if (!orderId) {
      throw new Error('Order ID not found in payment response');
    }

    const isSuccess = paymentData.ResponseCode === '00' || paymentData.ResponseCode === '0';

    const { data, error } = await supabase
      .from('users')
      .update({
        payment_status: isSuccess ? 'completed' : 'failed',
        payment_txn_ref: paymentData.TxnRefNo,
        payment_gateway_ref: paymentData.RetRefNo || paymentData.BankRefNo,
        payment_amount: paymentData.Amount,
        payment_response_code: paymentData.ResponseCode,
        payment_message: paymentData.Message || paymentData.ResponseMessage,
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select();

    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }

    console.log('Payment status updated successfully for user:', orderId);
    return data;
  } catch (error) {
    console.error('Payment status update error:', error);
    throw error;
  }
}
