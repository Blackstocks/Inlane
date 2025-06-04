import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, customerName, customerEmail, customerPhone, userData } = body;

    // First, save user data to database and get the ID
    const { data: savedUser, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Generate unique transaction reference
    const txnRefNo = `TXN${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
    
    // Prepare payment parameters (order matters for ICICI)
    const paymentParams = {
      Amount: amount.toString(),
      BankId: process.env.PAYMENT_BANK_ID,
      Currency: "356", // INR
      Email: customerEmail,
      FirstName: customerName,
      MCC: process.env.PAYMENT_MCC,
      MerchantId: process.env.PAYMENT_MERCHANT_ID,
      MerchantTRID: `MVTRN${Date.now()}`,
      OrderInfo: `Course_${savedUser.id}`,
      PassCode: process.env.PAYMENT_PASS_CODE,
      Phone: customerPhone,
      ReturnURL: process.env.PAYMENT_RETURN_URL,
      TerminalId: process.env.PAYMENT_TERMINAL_ID,
      TxnRefNo: txnRefNo,
      TxnType: process.env.PAYMENT_TXN_TYPE,
      Version: process.env.PAYMENT_VERSION
    };

    // Generate secure hash
    const secureHash = generateSecureHash(paymentParams);
    paymentParams.SecureHash = secureHash;

    // Encrypt the data using ICICI format
    const encData = encryptDataICICI(paymentParams);

    // Prepare form data for gateway submission
    const formData = {
      MerchantId: process.env.PAYMENT_MERCHANT_ID,
      TerminalId: process.env.PAYMENT_TERMINAL_ID,
      BankId: process.env.PAYMENT_BANK_ID,
      EncData: encData
    };

    console.log('Payment request prepared:', {
      txnRefNo,
      userId: savedUser.id,
      amount: amount.toString()
    });

    return NextResponse.json({
      success: true,
      gatewayURL: process.env.PAYMENT_GATEWAY_URL,
      formData,
      txnRefNo,
      userId: savedUser.id
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

function generateSecureHash(params: any): string {
  try {
    const salt = process.env.PAYMENT_SALT_KEY;
    // Sort keys alphabetically (excluding SecureHash)
    const sortedKeys = Object.keys(params).filter(key => key !== 'SecureHash').sort();
    
    // Create hash string starting with salt
    let hashString = salt;
    
    for (const key of sortedKeys) {
      if (params[key] && params[key] !== '') {
        hashString += params[key];
      }
    }
    
    console.log('Hash string length:', hashString.length);
    
    return crypto.createHash('sha256').update(hashString).digest('hex').toUpperCase();
  } catch (error) {
    console.error('Hash generation error:', error);
    throw new Error('Failed to generate secure hash');
  }
}

function encryptDataICICI(params: any): string {
  try {
    // Create parameter string in ICICI format: key||value::key||value
    const paramString = Object.keys(params)
      .map(key => `${key}||${params[key] || ''}`)
      .join('::');
    
    console.log('Parameter string to encrypt:', paramString.substring(0, 200) + '...');
    
    // Get encryption key and ensure it's 32 bytes
    const encryptionKey = process.env.PAYMENT_ENC_KEY;
    let key = Buffer.from(encryptionKey, 'hex');
    
    // Ensure key is exactly 32 bytes for AES-256
    if (key.length !== 32) {
      if (key.length < 32) {
        // Pad with zeros if too short
        const padding = Buffer.alloc(32 - key.length);
        key = Buffer.concat([key, padding]);
      } else {
        // Truncate if too long
        key = key.slice(0, 32);
      }
    }
    
    // Use static IV of zeros (common for ICICI integrations)
    const iv = Buffer.alloc(16, 0);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    cipher.setAutoPadding(true);
    
    // Encrypt the data
    let encrypted = cipher.update(paramString, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    console.log('Encryption successful, encrypted length:', encrypted.length);
    
    return encrypted;
    
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Encryption failed: ${error.message}`);
  }
}
