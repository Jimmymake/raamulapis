// src/server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db/index.js";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import cors from "cors";
import paymentRoutes from "./routes/payments.js";
import trackingRoutes from "./routes/tracking.js";
import uploadRoutes from "./routes/uploads.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

// Trust proxy for production (behind nginx/load balancer)
if (isProduction) {
  app.set("trust proxy", 1);
}

// Security headers (manual implementation - no helmet dependency needed)
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Remove powered by header
  res.removeHeader("X-Powered-By");
  
  if (isProduction) {
    // Strict Transport Security (HTTPS only)
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  
  next();
});

// Body parser with size limit
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: isProduction ? "1d" : 0, // Cache in production
  etag: true
}));

// CORS Configuration - Allow multiple origins
const allowedOrigins = [
  // Development origins
  ...(isProduction ? [] : [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:4200",
    "http://localhost:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
  ]),
  // Production origins from environment
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow all origins in development
    if (!isProduction) {
      return callback(null, true);
    }
    
    // Log blocked origins in production for debugging
    console.warn(`[CORS] Blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400
}));

// Health check endpoint
app.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT NOW() AS now");
    res.json({ 
      status: "OK",
      message: "E-commerce API with M-Pesa is running",
      serverTime: rows[0].now,
      version: "2.0.0"
    });
  } catch (err) {
    console.error("Database query failed:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

// API Documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "E-commerce API with M-Pesa Payment & Order Tracking",
    version: "2.0.0",
    endpoints: {
      auth: {
        signup: "POST /api/auth/signup",
        login: "POST /api/auth/login",
        changePassword: "POST /api/auth/change-password (protected)",
        verify: "GET /api/auth/verify (protected)",
      },
      users: {
        getAll: "GET /api/users (admin only)",
        getProfile: "GET /api/users/profile (protected)",
        getById: "GET /api/users/:id (admin or owner)",
        create: "POST /api/users (admin only)",
        update: "PUT /api/users/:id (admin or owner)",
        changeStatus: "PATCH /api/users/:id/status (admin only)",
        delete: "DELETE /api/users/:id (super admin only)",
        stats: "GET /api/users/stats (admin only)",
      },
      products: {
        getAll: "GET /api/products (public)",
        getById: "GET /api/products/:id (public)",
        getBySku: "GET /api/products/sku/:sku (public)",
        create: "POST /api/products (admin only)",
        update: "PUT /api/products/:id (admin only)",
        delete: "DELETE /api/products/:id (admin only)",
      },
      orders: {
        create: "POST /api/orders (protected)",
        getAll: "GET /api/orders (protected)",
        getById: "GET /api/orders/:id (protected)",
        getByOrderId: "GET /api/orders/order-id/:order_id (protected)",
        getByCustomerId: "GET /api/orders/customer/:customer_id (protected)",
        update: "PUT /api/orders/:id (admin only)",
        delete: "DELETE /api/orders/:id (admin only)",
      },
      payments: {
        initiate: "POST /api/payments/initiate (protected)",
        callback: "POST /api/payments/callback (public - M-Pesa webhook)",
        checkStatus: "GET /api/payments/status/:checkout_request_id (protected)",
        getAll: "GET /api/payments (protected)",
        getById: "GET /api/payments/:id (protected)",
        getOrderPayments: "GET /api/payments/order/:order_id (protected)",
        getUserPayments: "GET /api/payments/user/:user_id (protected)",
        getStats: "GET /api/payments/statistics/all (admin only)",
        cancel: "PATCH /api/payments/:id/cancel (protected)",
      },
      tracking: {
        addTracking: "POST /api/tracking (admin only)",
        getAll: "GET /api/tracking (admin only)",
        getOrderTracking: "GET /api/tracking/order/:order_id (protected)",
        getLatestTracking: "GET /api/tracking/order/:order_id/latest (protected)",
        delete: "DELETE /api/tracking/:id (admin only)",
      },
      uploads: {
        uploadSingle: "POST /api/uploads/single (admin only)",
        uploadMultiple: "POST /api/uploads/multiple (admin only)",
        listImages: "GET /api/uploads (admin only)",
        deleteImage: "DELETE /api/uploads/:filename (admin only)",
        serveImage: "GET /uploads/products/:filename (public)"
      }
    },
    roles: {
      super_admin: "Full access to everything including user management",
      admin: "Can manage products, orders, payments, and tracking. View all data",
      user: "Can view products, create orders, make payments, track own orders"
    },
    features: {
      mpesa: "M-Pesa STK Push integration for payments",
      tracking: "Real-time order tracking system",
      rbac: "Role-based access control with 3 levels",
      audit: "Transaction and order audit trail"
    }
  });
});

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/uploads", uploadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: "Route not found",
    ...(isProduction ? {} : { hint: "Visit GET /api for available endpoints" })
  });
});

// Global error handler
app.use((err, req, res, next) => {
  // Log error (use proper logging in production)
  if (isProduction) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  } else {
    console.error("Error:", err);
  }
  
  // CORS error handling
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: "CORS policy violation" });
  }
  
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(!isProduction && { stack: err.stack })
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Raamul API running on port ${PORT} [${NODE_ENV}]`);
  if (!isProduction) {
    console.log(`📚 API documentation: http://localhost:${PORT}/api`);
    console.log(`✅ Health check: http://localhost:${PORT}/`);
  }
  console.log(`💳 Payment Provider: ${process.env.PAYMENT_PROVIDER || 'impala'}`);
});