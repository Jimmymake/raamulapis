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
app.use(express.json());

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const PORT = process.env.PORT || 3002;

// CORS Configuration - Allow multiple origins
const allowedOrigins = [
  "http://localhost:5173",      // Vite default
  "http://localhost:3000",      // React default
  "http://localhost:3001",      // Alternative
  "http://localhost:4200",      // Angular default
  "http://localhost:8080",      // Vue default
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  process.env.CLIENT_URL,       // From environment
  process.env.FRONTEND_URL,     // Alternative env var
].filter(Boolean); // Remove undefined/null values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Block in production if not in allowed list
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400 // Cache preflight for 24 hours
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
    hint: "Visit GET /api for available endpoints"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 E-commerce API with M-Pesa running on port ${PORT}`);
  console.log(`📚 API documentation: http://localhost:${PORT}/api`);
  console.log(`✅ Health check: http://localhost:${PORT}/`);
  console.log(`💳 M-Pesa Environment: ${process.env.MPESA_ENVIRONMENT || 'sandbox'}`);
});