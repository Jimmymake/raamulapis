// src/services/mpesaService.js
import axios from "axios";
import config from "../config/config.js";

class MpesaService {
  constructor() {
    this.consumerKey = config.mpesa.consumerKey;
    this.consumerSecret = config.mpesa.consumerSecret;
    this.businessShortCode = config.mpesa.businessShortCode;
    this.passkey = config.mpesa.passkey;
    this.callbackUrl = config.mpesa.callbackUrl;
    this.environment = config.mpesa.environment; // 'sandbox' or 'production'
    
    this.baseUrl = this.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  // Get OAuth token
  async getAccessToken() {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error("M-Pesa token error:", error.response?.data || error.message);
      throw new Error("Failed to get M-Pesa access token");
    }
  }

  // Generate password for STK push
  generatePassword() {
    const timestamp = this.getTimestamp();
    const password = Buffer.from(
      `${this.businessShortCode}${this.passkey}${timestamp}`
    ).toString('base64');
    
    return { password, timestamp };
  }

  // Get timestamp in format YYYYMMDDHHmmss
  getTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  // Format phone number to 254XXXXXXXXX
  formatPhoneNumber(phone) {
    // Remove any spaces, dashes, or plus signs
    phone = phone.replace(/[\s\-\+]/g, '');
    
    // If starts with 0, replace with 254
    if (phone.startsWith('0')) {
      phone = '254' + phone.substring(1);
    }
    
    // If doesn't start with 254, add it
    if (!phone.startsWith('254')) {
      phone = '254' + phone;
    }
    
    return phone;
  }

  // Initiate STK Push (Lipa na M-Pesa Online)
  async initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const requestBody = {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.ceil(amount), // M-Pesa only accepts integers
        PartyA: formattedPhone,
        PartyB: this.businessShortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc || "Payment for order",
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("STK Push error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessage || "Failed to initiate M-Pesa payment");
    }
  }

  // Query STK Push transaction status
  async queryStkPushStatus(checkoutRequestID) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();

      const requestBody = {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID,
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("STK Query error:", error.response?.data || error.message);
      throw new Error("Failed to query M-Pesa transaction status");
    }
  }

  // Parse callback data
  parseCallbackData(callbackBody) {
    try {
      const { Body } = callbackBody;
      const { stkCallback } = Body;
      
      const result = {
        merchantRequestID: stkCallback.MerchantRequestID,
        checkoutRequestID: stkCallback.CheckoutRequestID,
        resultCode: stkCallback.ResultCode,
        resultDesc: stkCallback.ResultDesc,
      };

      // If successful, extract metadata
      if (stkCallback.ResultCode === 0 && stkCallback.CallbackMetadata) {
        const metadata = {};
        stkCallback.CallbackMetadata.Item.forEach(item => {
          metadata[item.Name] = item.Value;
        });
        
        result.amount = metadata.Amount;
        result.mpesaReceiptNumber = metadata.MpesaReceiptNumber;
        result.transactionDate = metadata.TransactionDate;
        result.phoneNumber = metadata.PhoneNumber;
      }

      return result;
    } catch (error) {
      console.error("Callback parsing error:", error);
      throw new Error("Failed to parse M-Pesa callback");
    }
  }
}

export default new MpesaService();