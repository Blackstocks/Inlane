// lib/paymentGateway.ts
import crypto from 'crypto';

export interface PaymentConfig {
  merchantId: string;
  aggregatorSecretKey: string;
  merchantSecretKey: string;
  baseUrl: string;
}

export interface PaymentRequest {
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
}

export interface InitiateSaleRequest {
  merchantId: string;
  merchantTxnNo: string;
  amount: string;
  currencyCode: string;
  payType: string;
  customerEmailID: string;
  transactionType: string;
  txnDate: string;
  returnURL: string;
  secureHash: string;
  customerMobileNo: string;
  addlParam1: string;
  addlParam2: string;
}

export interface PhiCommerceResponse {
  responseCode: string;
  merchantId: string;
  aggregatorID: string | null;
  merchantTxnNo: string;
  redirectURI: string;
  showOTPCapturePage: string;
  generateOTPURI: string | null;
  verifyOTPURI: string | null;
  authorizeURI: string | null;
  tranCtx: string;
  secureHash: string;
}

export class PhiCommerceGateway {
  private config: PaymentConfig;

  constructor(config: PaymentConfig) {
    this.config = config;
  }

  // Generate HMAC-SHA256 hash
  private generateSecureHash(data: string, key: string): string {
    return crypto.createHmac('sha256', key).update(data, 'ascii').digest('hex');
  }

  // Generate unique transaction number
  private generateTransactionNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `TXN${timestamp}${random}`;
  }

  // Generate transaction date in required format
  private generateTxnDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
  }

  // Create secure hash for initiate sale request
  private createInitiateSaleHash(request: Omit<InitiateSaleRequest, 'secureHash'>): string {
    // Hash string order: addlParam1+addlParam2+amount+currencyCode+customerEmailID+customerMobileNo+merchantId+merchantTxnNo+payType+returnURL+transactionType+txnDate
    const hashString = [
      request.addlParam1,
      request.addlParam2,
      request.amount,
      request.currencyCode,
      request.customerEmailID,
      request.customerMobileNo,
      request.merchantId,
      request.merchantTxnNo,
      request.payType,
      request.returnURL,
      request.transactionType,
      request.txnDate
    ].join('');

    console.log('Hash string:', hashString);
    console.log('Using aggregator key:', this.config.aggregatorSecretKey);
    
    return this.generateSecureHash(hashString, this.config.aggregatorSecretKey);
  }

  // Initiate payment
  async initiatePayment(paymentRequest: PaymentRequest): Promise<{
    success: boolean;
    transactionId: string;
    redirectUrl?: string;
    error?: string;
  }> {
    try {
      const merchantTxnNo = this.generateTransactionNumber();
      const txnDate = this.generateTxnDate();
      
      const initiateSaleRequest: Omit<InitiateSaleRequest, 'secureHash'> = {
        merchantId: this.config.merchantId,
        merchantTxnNo,
        amount: paymentRequest.amount.toFixed(2),
        currencyCode: '356', // INR
        payType: '0', // Redirect mode
        customerEmailID: paymentRequest.customerEmail,
        transactionType: 'SALE',
        txnDate,
        returnURL: paymentRequest.returnUrl,
        customerMobileNo: paymentRequest.customerPhone || '9999999999',
        addlParam1: paymentRequest.customerName,
        addlParam2: 'NextJS Integration'
      };

      const secureHash = this.createInitiateSaleHash(initiateSaleRequest);
      
      const finalRequest: InitiateSaleRequest = {
        ...initiateSaleRequest,
        secureHash
      };

      console.log('Sending request to PhiCommerce:', JSON.stringify(finalRequest, null, 2));

      const response = await fetch(`${this.config.baseUrl}/pg/api/v2/initiateSale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalRequest),
      });

      const responseText = await response.text();
      console.log('PhiCommerce raw response:', responseText);

      let data: PhiCommerceResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse PhiCommerce response:', parseError);
        return {
          success: false,
          transactionId: merchantTxnNo,
          error: 'Invalid response from payment gateway'
        };
      }

      console.log('PhiCommerce parsed response:', data);

      if (data.responseCode === 'R1000' && data.redirectURI && data.tranCtx) {
        const redirectUrl = `${data.redirectURI}?tranCtx=${data.tranCtx}`;
        
        return {
          success: true,
          transactionId: merchantTxnNo,
          redirectUrl
        };
      } else {
        return {
          success: false,
          transactionId: merchantTxnNo,
          error: `Payment initiation failed: ${data.responseCode || 'Unknown error'}`
        };
      }

    } catch (error) {
      console.error('PhiCommerce API error:', error);
      return {
        success: false,
        transactionId: 'ERROR',
        error: `Payment gateway error: ${(error as Error).message}`
      };
    }
  }

  // Check transaction status
  async checkTransactionStatus(merchantTxnNo: string, amount: string): Promise<{
    success: boolean;
    status?: string;
    error?: string;
  }> {
    try {
      // Create hash for status check
      const hashString = [
        amount,
        this.config.merchantId,
        merchantTxnNo,
        merchantTxnNo, // originalTxnNo is same as merchantTxnNo for status check
        'STATUS'
      ].join('');

      const secureHash = this.generateSecureHash(hashString, this.config.aggregatorSecretKey);

      const formData = new URLSearchParams({
        merchantID: this.config.merchantId,
        merchantTxnNo: merchantTxnNo,
        originalTxnNo: merchantTxnNo,
        transactionType: 'STATUS',
        secureHash: secureHash,
        aggregatorID: 'J_03345', // This should match your aggregator ID
        amount: amount
      });

      const response = await fetch(`${this.config.baseUrl}/pg/api/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const responseText = await response.text();
      console.log('Status check response:', responseText);

      // Parse the response (format may vary)
      const data = JSON.parse(responseText);
      
      return {
        success: true,
        status: data.status || data.responseCode,
      };

    } catch (error) {
      console.error('Status check error:', error);
      return {
        success: false,
        error: `Status check failed: ${(error as Error).message}`
      };
    }
  }
}

// Default configuration for UAT environment
export const getPhiCommerceConfig = (): PaymentConfig => ({
  merchantId: 'T_03345',
  aggregatorSecretKey: '36e14e446bd44891b29379d27dad93c1',
  merchantSecretKey: 'abc',
  baseUrl: 'https://qa.phicommerce.com'
});

// Export singleton instance
export const phiCommerceGateway = new PhiCommerceGateway(getPhiCommerceConfig());