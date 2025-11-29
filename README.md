# 🛒 Raamul E-Commerce API

A comprehensive REST API for e-commerce with M-Pesa payment integration, order tracking, and role-based access control.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-ISC-yellow)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [API Overview](#-api-overview)
- [Authentication](#-authentication)
- [Role-Based Access Control](#-role-based-access-control)
- [Documentation](#-documentation)

---

## ✨ Features

### Core Features
- **User Management** - Registration, authentication, profile management
- **Product Catalog** - Full CRUD with categories, brands, images, tags
- **Order System** - Create, track, and manage orders
- **Payment Integration** - M-Pesa STK Push (Lipa na M-Pesa)
- **Order Tracking** - Real-time status updates with location

### Security Features
- **JWT Authentication** - Secure token-based auth
- **Role-Based Access Control** - 3-tier permission system
- **Input Validation** - Comprehensive request validation
- **Password Reset** - Email-based reset flow
- **Email Verification** - Account verification system

### Developer Features
- **Pagination** - All list endpoints support pagination
- **Image Upload** - Multer-based file uploads
- **API Documentation** - Self-documenting `/api` endpoint
- **Error Handling** - Consistent error responses

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 18+ |
| Framework | Express.js 5.x |
| Database | MySQL 8.x |
| Authentication | JWT (jsonwebtoken) |
| Password Hashing | bcrypt |
| File Uploads | Multer |
| Validation | express-validator |
| Email | Nodemailer |
| Payments | M-Pesa Daraja API |
| HTTP Client | Axios |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- MySQL 8.x
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/raamulapis.git
cd raamulapis

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Or start production server
npm start
```

### Verify Installation

```bash
# Health check
curl http://localhost:3002/

# Response:
{
  "status": "OK",
  "message": "E-commerce API with M-Pesa is running",
  "serverTime": "2024-11-28T10:00:00.000Z",
  "version": "2.0.0"
}
```

---

## 📁 Project Structure

```
raamulapis/
├── src/
│   ├── config/
│   │   └── config.js           # Environment configuration
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── userController.js   # User management
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   ├── orderTrackingController.js
│   │   └── uploadController.js
│   ├── middlewares/
│   │   ├── auth.js             # JWT verification
│   │   ├── rbac.js             # Role-based access control
│   │   ├── validate.js         # Input validation rules
│   │   └── upload.js           # File upload config
│   ├── models/
│   │   ├── userModel.js
│   │   ├── productModel.js
│   │   ├── orderModel.js
│   │   ├── paymentModel.js
│   │   └── orderTrackingModel.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── payments.js
│   │   ├── tracking.js
│   │   └── uploads.js
│   ├── services/
│   │   ├── mpesaService.js     # M-Pesa integration
│   │   └── emailService.js     # Email sending
│   ├── utils/
│   │   └── pagination.js       # Pagination helpers
│   ├── db/
│   │   └── index.js            # Database connection
│   └── server.js               # Application entry point
├── uploads/
│   └── products/               # Uploaded product images
├── package.json
├── .env                        # Environment variables (not in git)
├── .env.example                # Environment template
├── README.md                   # This file
├── readm2.md.md               # API Reference
└── readme3.md                  # Development Guide
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3002
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database (MySQL)
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=raamul_ecommerce

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# M-Pesa (Safaricom Daraja API)
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/callback

# Email (Optional - for password reset & verification)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Raamul E-Commerce <noreply@raamul.com>
```

---

## 📡 API Overview

### Base URL
```
http://localhost:3002/api
```

### Endpoint Summary

| Module | Endpoints | Description |
|--------|-----------|-------------|
| Auth | 9 | Registration, login, password reset, email verification |
| Users | 8 | User CRUD, profile, statistics |
| Products | 6 | Product catalog management |
| Orders | 7 | Order creation and management |
| Payments | 9 | M-Pesa payment processing |
| Tracking | 5 | Order status tracking |
| Uploads | 4 | Image upload management |

### Quick Reference

```
# Authentication
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/verify-reset-token/:token
GET    /api/auth/verify-email/:token
POST   /api/auth/change-password      (protected)
GET    /api/auth/verify               (protected)
POST   /api/auth/resend-verification  (protected)
GET    /api/auth/verification-status  (protected)

# Users
GET    /api/users                     (admin)
GET    /api/users/profile             (protected)
GET    /api/users/stats               (admin)
GET    /api/users/:id                 (admin/owner)
POST   /api/users                     (admin)
PUT    /api/users/:id                 (admin/owner)
PATCH  /api/users/:id/status          (admin)
DELETE /api/users/:id                 (super_admin)

# Products
GET    /api/products                  (public)
GET    /api/products/:id              (public)
GET    /api/products/sku/:sku         (public)
POST   /api/products                  (admin)
PUT    /api/products/:id              (admin)
DELETE /api/products/:id              (admin)

# Orders
POST   /api/orders                    (protected)
GET    /api/orders                    (protected)
GET    /api/orders/:id                (protected)
GET    /api/orders/order-id/:order_id (protected)
GET    /api/orders/customer/:id       (protected)
PUT    /api/orders/:id                (admin)
DELETE /api/orders/:id                (admin)

# Payments
POST   /api/payments/initiate         (protected)
POST   /api/payments/callback         (public - M-Pesa)
GET    /api/payments                  (protected)
GET    /api/payments/:id              (protected)
GET    /api/payments/status/:checkout_id (protected)
GET    /api/payments/order/:order_id  (protected)
GET    /api/payments/user/:user_id    (protected)
GET    /api/payments/statistics/all   (admin)
PATCH  /api/payments/:id/cancel       (protected)

# Tracking
POST   /api/tracking                  (admin)
GET    /api/tracking                  (admin)
GET    /api/tracking/order/:order_id  (protected)
GET    /api/tracking/order/:order_id/latest (protected)
DELETE /api/tracking/:id              (admin)

# Uploads
POST   /api/uploads/single            (admin)
POST   /api/uploads/multiple          (admin)
GET    /api/uploads                   (admin)
DELETE /api/uploads/:filename         (admin)
GET    /uploads/products/:filename    (public - static)
```

---

## 🔐 Authentication

### JWT Token

All protected endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Getting a Token

```bash
# Login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'

# Response includes token
{
  "message": "Login successful",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Token Payload

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "role": "user",
  "iat": 1700000000,
  "exp": 1700604800
}
```

---

## 👥 Role-Based Access Control

### Role Hierarchy

| Role | Level | Permissions |
|------|-------|-------------|
| `super_admin` | 3 | Full access to everything |
| `admin` | 2 | Manage products, orders, payments, tracking |
| `user` | 1 | View products, manage own orders/payments |

### Access Levels

- **Public** 🌐 - No authentication required
- **Protected** 🔒 - Any authenticated user
- **Admin** 👑 - Admin or Super Admin only
- **Super Admin** ⭐ - Super Admin only

---

## 📚 Documentation

- **[README.md](./README.md)** - Project overview and setup (this file)
- **[readm2.md.md](./readm2.md.md)** - Complete API Reference with examples
- **[readme3.md](./readme3.md)** - Development guide and integration

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 📞 Support

For support, email support@raamul.com or create an issue in the repository.

---

**Built with ❤️ by Raamul Team**
