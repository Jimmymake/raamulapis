// src/services/impalaPayService.js
import axios from "axios";
import config from "../config/config.js";

const isDev = process.env.NODE_ENV !== "production";

class ImpalaPayService {
  constructor() {
    this.baseUrl = config.impalaPay?.baseUrl || "https://payments.mam-laka.com/api/v1";
    this.merchantId = config.impalaPay?.merchantId;
    this.username = config.impalaPay?.username;
    this.password = config.impalaPay?.password;
    this.displayName = config.impalaPay?.displayName || "Raamul International Limited";
    this.callbackUrl = config.impalaPay?.callbackUrl;
    
    // Token cache
    this.tokenCache = {
      token: null,
      expiresAtMs: 0,
    };
  }

  // Production-safe logging
  log(message, data = null) {
    if (isDev) {
      if (data) {
        console.log(`[Impala Pay] ${message}`, data);
      } else {
        console.log(`[Impala Pay] ${message}`);
      }
    }
  }

  logError(message, error) {
    // Always log errors, but sanitize in production
    const errorData = isDev ? error : (error?.message || "Payment error");
    console.error(`[Impala Pay] ${message}`, errorData);
  }

  // Check if cached token is still valid (with 15s buffer)
  isTokenValid() {
    return Boolean(this.tokenCache.token) && 
           Date.now() < (this.tokenCache.expiresAtMs - 15000);
  }

  // Get Bearer Token using Basic Auth
  async getBearerToken() {
    // Return cached token if still valid
    if (this.isTokenValid()) {
      this.log("Using cached token");
      return this.tokenCache.token;
    }

    const username = this.username;
    const password = this.password;

    if (!username || !password) {
      throw new Error("Impala Pay credentials not configured");
    }

    const basicAuth = Buffer.from(`${username}:${password}`).toString("base64");

    this.log("Requesting new token");

    try {
      const response = await axios.get(`${this.baseUrl}/`, {
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Accept": "application/json",
        },
        timeout: 15000,
      });

      const { token, expires_at } = response.data;

      if (!token || !expires_at) {
        throw new Error("Token response missing token or expires_at");
      }

      // Parse expiration
      const expiresDate = new Date(expires_at);
      const expiresAtMs = isNaN(expiresDate.getTime()) 
        ? Date.now() + 4 * 60 * 60 * 1000  // Default 4 hours if invalid
        : expiresDate.getTime();

      // Cache the token
      this.tokenCache = { token, expiresAtMs };
      
      this.log("Token obtained, expires:", expiresDate.toISOString());

      return token;
    } catch (error) {
      this.logError("Token fetch error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        "Failed to get Impala Pay token"
      );
    }
  }

  // Format phone number to +254XXXXXXXXX
  formatPhoneNumber(phone) {
    // Remove any spaces or dashes
    phone = phone.replace(/[\s\-]/g, '');
    
    // If starts with 0, replace with +254
    if (phone.startsWith('0')) {
      phone = '+254' + phone.substring(1);
    }
    
    // If starts with 254 (no plus), add plus
    if (phone.startsWith('254')) {
      phone = '+' + phone;
    }
    
    // If doesn't start with +254, add it
    if (!phone.startsWith('+254')) {
      phone = '+254' + phone;
    }
    
    return phone;
  }

  // Generate unique external ID
  generateExternalId(orderId) {
    const timestamp = Date.now();
    return `${orderId}-${timestamp}`;
  }

  // Initiate Mobile Money Payment (M-Pesa, Airtel Money, etc.)
  async initiatePayment(phoneNumber, amount, orderId, currency = "KES", provider = "m-pesa") {
    try {
      // Validate required fields
      if (!phoneNumber || !amount || !orderId) {
        throw new Error("Missing required payment parameters");
      }

      if (!this.callbackUrl) {
        throw new Error("Payment callback URL not configured");
      }

      // Step 1: Get Bearer Token
      const token = await this.getBearerToken();

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const externalId = this.generateExternalId(orderId);

      const requestBody = {
        impalaMerchantId: this.merchantId,
        displayName: this.displayName,
        currency: currency,
        amount: Math.ceil(amount), // Ensure integer
        payerPhone: formattedPhone,
        mobileMoneySP: provider, // "m-pesa", "airtel-money", etc.
        externalId: externalId,
        callbackUrl: this.callbackUrl,
      };

      this.log("Initiating payment for order:", orderId);

      // Step 2: Initiate Payment with Bearer Token
      const response = await axios.post(
        `${this.baseUrl}/mobile/initiate`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          timeout: 30000,
        }
      );

      this.log("Payment initiated successfully, transactionId:", response.data.transactionId);

      return {
        success: true,
        externalId: externalId,
        transactionId: response.data.transactionId || response.data.id,
        checkoutRequestId: response.data.checkoutRequestId || externalId,
        merchantRequestId: response.data.merchantRequestId || this.merchantId,
        responseCode: response.data.responseCode || "0",
        responseDescription: response.data.responseDescription || response.data.message || "Payment initiated",
        customerMessage: response.data.customerMessage || "Please check your phone to complete payment",
        rawResponse: isDev ? response.data : undefined, // Only include raw response in dev
      };
    } catch (error) {
      this.logError("Payment initiation failed:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        "Failed to initiate payment"
      );
    }
  }

  // Check payment status
  async checkPaymentStatus(transactionId) {
    try {
      const token = await this.getBearerToken();
      
      const response = await axios.get(
        `${this.baseUrl}/mobile/status/${transactionId}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error) {
      console.error("[Impala Pay] Status check error:", error.response?.data || error.message);
      throw new Error("Failed to check payment status");
    }
  }

  // Parse callback data from Impala Pay
  parseCallbackData(callbackBody) {
    try {
      // Impala Pay callback structure may vary - adapt as needed
      const result = {
        externalId: callbackBody.externalId,
        transactionId: callbackBody.transactionId || callbackBody.id,
        checkoutRequestID: callbackBody.checkoutRequestId || callbackBody.externalId,
        merchantRequestID: callbackBody.merchantRequestId || this.merchantId,
        resultCode: callbackBody.resultCode ?? (callbackBody.status === "SUCCESS" ? 0 : 1),
        resultDesc: callbackBody.resultDesc || callbackBody.message || callbackBody.status,
        status: callbackBody.status, // SUCCESS, FAILED, PENDING
      };

      // If successful, extract additional data
      if (callbackBody.status === "SUCCESS" || callbackBody.resultCode === 0) {
        result.resultCode = 0;
        result.amount = callbackBody.amount;
        result.mpesaReceiptNumber = callbackBody.mpesaReceiptNumber || 
                                     callbackBody.receiptNumber || 
                                     callbackBody.transactionId;
        result.transactionDate = callbackBody.transactionDate || 
                                  callbackBody.timestamp || 
                                  Date.now();
        result.phoneNumber = callbackBody.payerPhone || callbackBody.phoneNumber;
      }

      return result;
    } catch (error) {
      console.error("Callback parsing error:", error);
      throw new Error("Failed to parse Impala Pay callback");
    }
  }
}

export default new ImpalaPayService();

