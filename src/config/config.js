// src/config/config.js
import dotenv from "dotenv";

dotenv.config();

const config = {
  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "simple_user_signup",
  },
  server: {
    port: process.env.PORT || 3001,
  },
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  mpesa: {
    consumerKey: process.env.MPESA_CONSUMER_KEY || "",
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || "",
    businessShortCode: process.env.MPESA_BUSINESS_SHORTCODE || "",
    passkey: process.env.MPESA_PASSKEY || "",
    callbackUrl: process.env.MPESA_CALLBACK_URL || "https://yourdomain.com/api/payments/callback",
    environment: process.env.MPESA_ENVIRONMENT || "sandbox", // 'sandbox' or 'production'
  },
  email: {
    host: process.env.EMAIL_HOST || "",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER || "",
    password: process.env.EMAIL_PASSWORD || "",
    from: process.env.EMAIL_FROM || "Raamul E-Commerce <noreply@raamul.com>",
  },
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
};

export default config;