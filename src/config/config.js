// src/config/config.js
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// Validate required environment variables in production
const validateProductionConfig = () => {
  const required = [
    "DB_HOST",
    "DB_USER", 
    "DB_PASSWORD",
    "DB_NAME",
    "JWT_SECRET",
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (isProduction && missing.length > 0) {
    console.error("❌ Missing required environment variables:", missing.join(", "));
    process.exit(1);
  }

  // Warn about insecure JWT secret
  if (isProduction && process.env.JWT_SECRET === "your-secret-key-change-in-production") {
    console.error("❌ SECURITY: JWT_SECRET must be changed in production!");
    process.exit(1);
  }
};

validateProductionConfig();

const config = {
  env: process.env.NODE_ENV || "development",
  isProduction,
  
  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "raamuldb",
    connectionLimit: parseInt(process.env.DB_POOL_SIZE) || 10,
  },
  
  server: {
    port: parseInt(process.env.PORT) || 3002,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  
  // Direct Safaricom M-Pesa Configuration
  mpesa: {
    consumerKey: process.env.MPESA_CONSUMER_KEY || "",
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || "",
    businessShortCode: process.env.MPESA_BUSINESS_SHORTCODE || "",
    passkey: process.env.MPESA_PASSKEY || "",
    callbackUrl: process.env.MPESA_CALLBACK_URL || "",
    environment: process.env.MPESA_ENVIRONMENT || "sandbox",
  },
  
  // Impala Pay (Mam-Laka) Configuration
  impalaPay: {
    baseUrl: process.env.IMPALA_PAY_BASE_URL || "https://payments.mam-laka.com/api/v1",
    merchantId: process.env.IMPALA_PAY_MERCHANT_ID,
    username: process.env.IMPALA_PAY_USERNAME,
    password: process.env.IMPALA_PAY_PASSWORD,
    displayName: process.env.IMPALA_PAY_DISPLAY_NAME || "Raamul International Limited",
    callbackUrl: process.env.IMPALA_PAY_CALLBACK_URL,
  },
  
  // Payment provider selection: 'impala' or 'mpesa'
  paymentProvider: process.env.PAYMENT_PROVIDER || "impala",
  
  email: {
    host: process.env.EMAIL_HOST || "",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER || "",
    password: process.env.EMAIL_PASSWORD || "",
    from: process.env.EMAIL_FROM || "Raamul E-Commerce <noreply@raamul.com>",
  },
  
  // Frontend URLs for CORS and email links
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  frontendUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173",
  adminUrl: process.env.ADMIN_URL || "",
};

export default config;