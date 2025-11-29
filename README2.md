# 📚 Raamul API Reference

Complete API documentation with request/response examples for all 48 endpoints.

---

## 📋 Table of Contents

- [Base URL & Headers](#base-url--headers)
- [Response Format](#response-format)
- [Pagination](#pagination)
- [Authentication Endpoints](#-authentication-endpoints)
- [User Endpoints](#-user-endpoints)
- [Product Endpoints](#-product-endpoints)
- [Order Endpoints](#-order-endpoints)
- [Payment Endpoints](#-payment-endpoints)
- [Tracking Endpoints](#-tracking-endpoints)
- [Upload Endpoints](#-upload-endpoints)
- [Error Codes](#-error-codes)

---

## Base URL & Headers

```
Base URL: http://localhost:3002/api
```

### Required Headers

```http
Content-Type: application/json
Authorization: Bearer <token>  # For protected routes
```

---

## Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Validation Error
```json
{
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 6 characters" }
  ]
}
```

---

## Pagination

All list endpoints support pagination with query parameters:

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `page` | 1 | - | Page number |
| `limit` | 10 | 100 | Items per page |

### Example Request
```http
GET /api/products?page=2&limit=20
```

### Pagination Response
```json
{
  "products": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

---

## 🔐 Authentication Endpoints

### 1. User Signup
Creates a new user account and sends verification email.

```http
POST /api/auth/signup
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123",
  "phone": "+254712345678",
  "location": "Nairobi, Kenya"
}
```

**Response (201):**
```json
{
  "message": "User created successfully. Please check your email to verify your account.",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "location": "Nairobi, Kenya",
    "phone": "+254712345678",
    "role": "user",
    "status": "active",
    "created_at": "2024-11-28T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. User Login
Authenticates user and returns JWT token.

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepass123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "status": "active",
    "last_login": "2024-11-28T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. Forgot Password
Sends password reset email.

```http
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

---

### 4. Reset Password
Resets password using token from email.

```http
POST /api/auth/reset-password
```

**Request Body:**
```json
{
  "token": "abc123resettoken...",
  "newPassword": "newSecurePass456"
}
```

**Response (200):**
```json
{
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

---

### 5. Verify Reset Token
Checks if reset token is valid.

```http
GET /api/auth/verify-reset-token/:token
```

**Response (200):**
```json
{
  "valid": true,
  "message": "Token is valid"
}
```

---

### 6. Verify Email
Verifies user email with token.

```http
GET /api/auth/verify-email/:token
```

**Response (200):**
```json
{
  "message": "Email verified successfully. You can now access all features."
}
```

---

### 7. Change Password 🔒
Changes password for authenticated user.

```http
POST /api/auth/change-password
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

---

### 8. Verify Token 🔒
Validates JWT token and returns user info.

```http
GET /api/auth/verify
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

### 9. Resend Verification Email 🔒
Resends verification email.

```http
POST /api/auth/resend-verification
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Verification email sent. Please check your inbox."
}
```

---

### 10. Check Verification Status 🔒
Checks if email is verified.

```http
GET /api/auth/verification-status
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "email_verified": true
}
```

---

## 👥 User Endpoints

### 1. Get All Users 👑
Returns all users with optional filters.

```http
GET /api/users?role=user&status=active&search=john&page=1&limit=10
Authorization: Bearer <admin_token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `role` | string | Filter by role (super_admin, admin, user) |
| `status` | string | Filter by status (active, inactive, suspended) |
| `search` | string | Search in username, email, phone |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response (200):**
```json
{
  "users": [
    {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "location": "Nairobi",
      "phone": "+254712345678",
      "role": "user",
      "status": "active",
      "last_login": "2024-11-28T10:00:00.000Z",
      "created_at": "2024-11-27T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 2. Get User Profile 🔒
Returns current user's profile.

```http
GET /api/users/profile
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "location": "Nairobi, Kenya",
    "phone": "+254712345678",
    "role": "user",
    "status": "active"
  }
}
```

---

### 3. Get User Statistics 👑
Returns user count by role.

```http
GET /api/users/stats
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "stats": [
    { "role": "super_admin", "count": 1 },
    { "role": "admin", "count": 5 },
    { "role": "user", "count": 150 }
  ]
}
```

---

### 4. Get User by ID 🔒
Returns specific user (admin can view any, users only themselves).

```http
GET /api/users/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "location": "Nairobi",
    "phone": "+254712345678",
    "role": "user",
    "status": "active"
  }
}
```

---

### 5. Create User 👑
Creates a new user (admin can create admins, super_admin can create super_admins).

```http
POST /api/users
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "username": "newuser",
  "email": "new@example.com",
  "password": "password123",
  "phone": "+254712345678",
  "location": "Mombasa",
  "role": "user"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 2,
    "username": "newuser",
    "email": "new@example.com",
    "role": "user",
    "status": "active"
  }
}
```

---

### 6. Update User 🔒
Updates user information (admin can update any, users only themselves).

```http
PUT /api/users/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "location": "Kisumu",
  "phone": "+254723456789"
}
```

**Response (200):**
```json
{
  "message": "User updated successfully",
  "user": { ... }
}
```

---

### 7. Change User Status 👑
Activates, deactivates, or suspends a user.

```http
PATCH /api/users/:id/status
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "status": "suspended"
}
```

**Response (200):**
```json
{
  "message": "User status updated successfully",
  "user": { ... }
}
```

---

### 8. Delete User ⭐
Permanently deletes a user (super_admin only).

```http
DELETE /api/users/:id
Authorization: Bearer <super_admin_token>
```

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

---

## 📦 Product Endpoints

### 1. Get All Products 🌐
Returns all products with optional filters.

```http
GET /api/products?category=Electronics&brand=Apple&status=active&search=phone&page=1&limit=20
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category |
| `brand` | string | Filter by brand |
| `status` | string | Filter by status (active, inactive) |
| `search` | string | Search in name, description, SKU |

**Response (200):**
```json
{
  "products": [
    {
      "id": 1,
      "name": "iPhone 15 Pro",
      "sku": "IPHONE-15-PRO",
      "description": "Latest Apple smartphone",
      "category": "Electronics",
      "brand": "Apple",
      "price": "149999.00",
      "currency": "KES",
      "stock": 25,
      "unit": "piece",
      "weight": "0.18",
      "packaging": "Box",
      "composition": null,
      "usage": null,
      "images": ["iphone1.jpg", "iphone2.jpg"],
      "tags": ["smartphone", "apple", "5G"],
      "status": "active",
      "created_at": "2024-11-27T10:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

### 2. Get Product by ID 🌐
Returns single product by database ID.

```http
GET /api/products/:id
```

**Response (200):**
```json
{
  "product": {
    "id": 1,
    "name": "iPhone 15 Pro",
    "sku": "IPHONE-15-PRO",
    ...
  }
}
```

---

### 3. Get Product by SKU 🌐
Returns single product by SKU.

```http
GET /api/products/sku/:sku
```

**Response (200):**
```json
{
  "product": {
    "id": 1,
    "name": "iPhone 15 Pro",
    "sku": "IPHONE-15-PRO",
    ...
  }
}
```

---

### 4. Create Product 👑
Creates a new product.

```http
POST /api/products
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "Samsung Galaxy S24",
  "sku": "SAMSUNG-S24",
  "description": "Latest Samsung smartphone",
  "category": "Electronics",
  "brand": "Samsung",
  "price": 129999.00,
  "currency": "KES",
  "stock": 50,
  "unit": "piece",
  "weight": 0.17,
  "packaging": "Box",
  "images": ["samsung1.jpg", "samsung2.jpg"],
  "tags": ["smartphone", "samsung", "android"],
  "status": "active"
}
```

**Response (201):**
```json
{
  "message": "Product created successfully",
  "product": { ... }
}
```

---

### 5. Update Product 👑
Updates an existing product.

```http
PUT /api/products/:id
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "price": 119999.00,
  "stock": 45
}
```

**Response (200):**
```json
{
  "message": "Product updated successfully",
  "product": { ... }
}
```

---

### 6. Delete Product 👑
Deletes a product.

```http
DELETE /api/products/:id
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "message": "Product deleted successfully"
}
```

---

## 🛒 Order Endpoints

### 1. Create Order 🔒
Creates a new order.

```http
POST /api/orders
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "order_id": "ORD-2024-001",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+254712345678"
  },
  "items": [
    {
      "product_id": 1,
      "name": "iPhone 15 Pro",
      "quantity": 1,
      "price": 149999.00
    }
  ],
  "pricing": {
    "subtotal": 149999.00,
    "tax": 23999.84,
    "shipping": 500.00,
    "total": 174498.84
  },
  "shipping": {
    "address": "123 Main St, Nairobi",
    "method": "Standard Delivery"
  },
  "payment": {
    "method": "M-Pesa",
    "status": "pending"
  },
  "notes": "Please deliver before 5 PM"
}
```

**Response (201):**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": 1,
    "order_id": "ORD-2024-001",
    "customer_id": "1",
    "order_status": "pending",
    ...
  }
}
```

---

### 2. Get All Orders 🔒
Returns orders (admin sees all, users see their own).

```http
GET /api/orders?order_status=pending&page=1&limit=10
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "orders": [...],
  "pagination": { ... }
}
```

---

### 3. Get Order by ID 🔒

```http
GET /api/orders/:id
Authorization: Bearer <token>
```

---

### 4. Get Order by Order ID 🔒

```http
GET /api/orders/order-id/:order_id
Authorization: Bearer <token>
```

---

### 5. Get Orders by Customer 🔒

```http
GET /api/orders/customer/:customer_id
Authorization: Bearer <token>
```

---

### 6. Update Order 👑

```http
PUT /api/orders/:id
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "order_status": "processing",
  "notes": "Payment confirmed"
}
```

---

### 7. Delete Order 👑

```http
DELETE /api/orders/:id
Authorization: Bearer <admin_token>
```

---

## 💳 Payment Endpoints

### 1. Initiate M-Pesa Payment 🔒
Sends STK push to customer's phone.

```http
POST /api/payments/initiate
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "order_id": "ORD-2024-001",
  "phone_number": "0712345678"
}
```

**Response (200):**
```json
{
  "message": "Payment initiated successfully. Please check your phone to complete payment.",
  "payment": {
    "id": 1,
    "order_id": "ORD-2024-001",
    "amount": 174498.84,
    "phone_number": "254712345678",
    "checkout_request_id": "ws_CO_191220191020363925",
    "payment_status": "pending"
  },
  "mpesa_response": {
    "merchant_request_id": "29115-34620561-1",
    "checkout_request_id": "ws_CO_191220191020363925",
    "response_code": "0",
    "response_description": "Success. Request accepted for processing"
  }
}
```

---

### 2. M-Pesa Callback 🌐
Webhook endpoint for M-Pesa notifications.

```http
POST /api/payments/callback
```

*This endpoint is called by M-Pesa automatically.*

---

### 3. Get All Payments 🔒

```http
GET /api/payments?payment_status=completed&page=1&limit=10
Authorization: Bearer <token>
```

---

### 4. Get Payment by ID 🔒

```http
GET /api/payments/:id
Authorization: Bearer <token>
```

---

### 5. Check Payment Status 🔒

```http
GET /api/payments/status/:checkout_request_id
Authorization: Bearer <token>
```

---

### 6. Get Order Payments 🔒

```http
GET /api/payments/order/:order_id
Authorization: Bearer <token>
```

---

### 7. Get User Payments 🔒

```http
GET /api/payments/user/:user_id
Authorization: Bearer <token>
```

---

### 8. Get Payment Statistics 👑

```http
GET /api/payments/statistics/all
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "statistics": {
    "total_transactions": 150,
    "successful_payments": 142,
    "failed_payments": 5,
    "pending_payments": 3,
    "total_amount": 5280000.00,
    "average_amount": 35200.00
  }
}
```

---

### 9. Cancel Payment 🔒

```http
PATCH /api/payments/:id/cancel
Authorization: Bearer <token>
```

---

## 📍 Tracking Endpoints

### 1. Add Tracking Update 👑

```http
POST /api/tracking
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "order_id": "ORD-2024-001",
  "status": "shipped",
  "location": "Nairobi Distribution Center",
  "notes": "Package dispatched via DHL"
}
```

**Valid Statuses:**
- `pending`
- `confirmed`
- `processing`
- `packed`
- `shipped`
- `out_for_delivery`
- `delivered`
- `cancelled`
- `returned`

---

### 2. Get All Tracking 👑

```http
GET /api/tracking?order_id=ORD-2024-001&status=shipped
Authorization: Bearer <admin_token>
```

---

### 3. Get Order Tracking 🔒

```http
GET /api/tracking/order/:order_id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "order_id": "ORD-2024-001",
  "tracking_history": [
    {
      "id": 1,
      "status": "confirmed",
      "location": "Warehouse",
      "notes": "Order confirmed",
      "updated_by_username": "admin",
      "created_at": "2024-11-28T10:00:00.000Z"
    },
    {
      "id": 2,
      "status": "shipped",
      "location": "Distribution Center",
      "notes": "Package dispatched",
      "updated_by_username": "admin",
      "created_at": "2024-11-28T14:00:00.000Z"
    }
  ],
  "current_status": {
    "status": "shipped",
    "location": "Distribution Center",
    "created_at": "2024-11-28T14:00:00.000Z"
  }
}
```

---

### 4. Get Latest Tracking 🔒

```http
GET /api/tracking/order/:order_id/latest
Authorization: Bearer <token>
```

---

### 5. Delete Tracking Entry 👑

```http
DELETE /api/tracking/:id
Authorization: Bearer <admin_token>
```

---

## 📤 Upload Endpoints

### 1. Upload Single Image 👑

```http
POST /api/uploads/single
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `image`: File (JPEG, PNG, GIF, WebP, max 5MB)

**Response (201):**
```json
{
  "message": "Image uploaded successfully",
  "image": {
    "filename": "product-1234567890.jpg",
    "originalName": "my-photo.jpg",
    "size": 245678,
    "mimetype": "image/jpeg",
    "url": "/uploads/products/product-1234567890.jpg"
  }
}
```

---

### 2. Upload Multiple Images 👑

```http
POST /api/uploads/multiple
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `images`: Multiple files (max 10 files, 5MB each)

**Response (201):**
```json
{
  "message": "5 image(s) uploaded successfully",
  "images": [
    { "filename": "...", "url": "..." },
    ...
  ]
}
```

---

### 3. List Uploaded Images 👑

```http
GET /api/uploads
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "count": 10,
  "images": [
    {
      "filename": "product-1234567890.jpg",
      "url": "/uploads/products/product-1234567890.jpg",
      "size": 245678,
      "uploadedAt": "2024-11-28T10:00:00.000Z"
    }
  ]
}
```

---

### 4. Delete Image 👑

```http
DELETE /api/uploads/:filename
Authorization: Bearer <admin_token>
```

---

### 5. Serve Image 🌐
Static file serving (no auth required).

```http
GET /uploads/products/:filename
```

---

## ❌ Error Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input / Validation failed |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |

---

## 🔑 Legend

- 🌐 **Public** - No authentication required
- 🔒 **Protected** - Requires valid JWT token
- 👑 **Admin** - Requires admin or super_admin role
- ⭐ **Super Admin** - Requires super_admin role only

---

**End of API Reference**
