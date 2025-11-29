# 🛠 Raamul Development Guide

Development setup, email configuration, M-Pesa integration, and frontend integration guide.

---

## 📋 Table of Contents

- [Development Setup](#-development-setup)
- [Database Setup](#-database-setup)
- [Email Configuration](#-email-configuration)
- [M-Pesa Integration](#-m-pesa-integration)
- [Frontend Integration](#-frontend-integration)
- [Testing the API](#-testing-the-api)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## 💻 Development Setup

### Prerequisites

```bash
# Check Node.js version (requires 18+)
node --version

# Check npm version
npm --version

# Check MySQL
mysql --version
```

### Installation Steps

```bash
# 1. Clone repository
git clone https://github.com/yourusername/raamulapis.git
cd raamulapis

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env with your settings
nano .env

# 5. Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev     # Start with nodemon (auto-restart)
npm start       # Start production server
```

---

## 🗄 Database Setup

### Create MySQL Database

```sql
-- Login to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE raamul_ecommerce;

-- Create user (optional)
CREATE USER 'raamul_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON raamul_ecommerce.* TO 'raamul_user'@'localhost';
FLUSH PRIVILEGES;
```

### Auto-Created Tables

The API automatically creates these tables on startup:

| Table | Description |
|-------|-------------|
| `users` | User accounts and authentication |
| `products` | Product catalog |
| `orders` | Customer orders |
| `payments` | M-Pesa payment records |
| `order_tracking` | Order status history |

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  location VARCHAR(255),
  phone VARCHAR(50),
  password VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'admin', 'user') DEFAULT 'user',
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  email_verification_expires DATETIME,
  reset_password_token VARCHAR(255),
  reset_password_expires DATETIME,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Products Table
```sql
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(255),
  brand VARCHAR(255),
  price DECIMAL(10,2) NOT NULL,
  currency CHAR(3) DEFAULT 'KES',
  stock INT DEFAULT 0,
  unit VARCHAR(50),
  weight DECIMAL(10,2),
  packaging VARCHAR(255),
  composition TEXT,
  `usage` TEXT,
  images JSON,
  tags JSON,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Orders Table
```sql
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL UNIQUE,
  customer_id VARCHAR(100),
  customer JSON,
  items JSON NOT NULL,
  pricing JSON NOT NULL,
  shipping JSON,
  payment JSON,
  order_status ENUM('pending', 'confirmed', 'processing', 'packed', 
                    'shipped', 'out_for_delivery', 'delivered', 
                    'cancelled', 'returned') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Create First Super Admin

```sql
-- First, hash a password using bcrypt (do this in Node.js)
-- node -e "console.log(require('bcrypt').hashSync('admin123', 10))"

-- Then insert the admin
INSERT INTO users (username, email, password, role, status, email_verified)
VALUES ('admin', 'admin@raamul.com', '$2b$10$...hashed_password...', 'super_admin', 'active', TRUE);
```

---

## 📧 Email Configuration

### Development Mode (No Config)

Without email configuration, the API runs in **dev mode**:
- Emails are logged to console
- Tokens are included in API responses for testing
- No actual emails are sent

### Production Mode (Gmail Example)

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Raamul E-Commerce <noreply@raamul.com>
```

### Setting Up Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication
3. Go to App Passwords
4. Generate a new app password for "Mail"
5. Use this password in `EMAIL_PASSWORD`

### Other Email Providers

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

#### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your-mailgun-password
```

### Email Templates

The API sends these emails:

| Email | Trigger | Contains |
|-------|---------|----------|
| Verification | User signup | Verification link + token |
| Password Reset | Forgot password | Reset link + token |
| Password Changed | After reset | Confirmation notice |

---

## 💳 M-Pesa Integration

### Getting Daraja Credentials

1. Go to [Safaricom Daraja Portal](https://developer.safaricom.co.ke/)
2. Create an account / Login
3. Create a new app
4. Get Consumer Key and Consumer Secret
5. For sandbox testing, use provided test credentials

### Sandbox Configuration

```env
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_sandbox_consumer_key
MPESA_CONSUMER_SECRET=your_sandbox_consumer_secret
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/payments/callback
```

### Setting Up Callback URL (Local Development)

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3002

# Use the HTTPS URL in MPESA_CALLBACK_URL
# Example: https://abc123.ngrok.io/api/payments/callback
```

### Production Configuration

```env
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=your_live_consumer_key
MPESA_CONSUMER_SECRET=your_live_consumer_secret
MPESA_BUSINESS_SHORTCODE=your_paybill_number
MPESA_PASSKEY=your_production_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/callback
```

### Testing M-Pesa

```bash
# Test STK Push (sandbox)
curl -X POST http://localhost:3002/api/payments/initiate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-001",
    "phone_number": "254708374149"
  }'

# Use Safaricom test number: 254708374149
# Test PIN: Use any PIN in sandbox
```

### M-Pesa Flow

```
1. User initiates payment
   └─> POST /api/payments/initiate

2. API sends STK Push to Safaricom
   └─> STK Push appears on user's phone

3. User enters M-Pesa PIN
   └─> Safaricom processes payment

4. Safaricom calls webhook
   └─> POST /api/payments/callback

5. API updates payment status
   └─> Order status updated to "processing"
```

---

## 🎨 Frontend Integration

### React.js Example Setup

```bash
# Create React app
npm create vite@latest raamul-frontend -- --template react
cd raamul-frontend
npm install axios react-router-dom
```

### API Client Setup

```javascript
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Auth Service

```javascript
// src/services/authService.js
import api from './api';

export const authService = {
  async login(username, password) {
    const response = await api.post('/auth/login', { username, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  async signup(userData) {
    const response = await api.post('/auth/signup', userData);
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  async forgotPassword(email) {
    return api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token, newPassword) {
    return api.post('/auth/reset-password', { token, newPassword });
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};
```

### Products Service

```javascript
// src/services/productService.js
import api from './api';

export const productService = {
  async getAll(params = {}) {
    const response = await api.get('/products', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/products/${id}`);
    return response.data.product;
  },

  async getBySku(sku) {
    const response = await api.get(`/products/sku/${sku}`);
    return response.data.product;
  },

  async create(productData) {
    const response = await api.post('/products', productData);
    return response.data;
  },

  async update(id, productData) {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};
```

### Orders Service

```javascript
// src/services/orderService.js
import api from './api';

export const orderService = {
  async create(orderData) {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  async getAll(params = {}) {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  async getByOrderId(orderId) {
    const response = await api.get(`/orders/order-id/${orderId}`);
    return response.data;
  },

  async getTracking(orderId) {
    const response = await api.get(`/tracking/order/${orderId}`);
    return response.data;
  },
};
```

### Payment Service

```javascript
// src/services/paymentService.js
import api from './api';

export const paymentService = {
  async initiatePayment(orderId, phoneNumber) {
    const response = await api.post('/payments/initiate', {
      order_id: orderId,
      phone_number: phoneNumber,
    });
    return response.data;
  },

  async checkStatus(checkoutRequestId) {
    const response = await api.get(`/payments/status/${checkoutRequestId}`);
    return response.data;
  },

  async getOrderPayments(orderId) {
    const response = await api.get(`/payments/order/${orderId}`);
    return response.data;
  },
};
```

### Image Upload

```javascript
// src/services/uploadService.js
import api from './api';

export const uploadService = {
  async uploadSingle(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/uploads/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async uploadMultiple(files) {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));

    const response = await api.post('/uploads/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getImageUrl(filename) {
    return `http://localhost:3002/uploads/products/${filename}`;
  },
};
```

### React Context for Auth

```javascript
// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = authService.getUser();
    setUser(user);
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## 🧪 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3002/

# Signup
curl -X POST http://localhost:3002/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Get products (with pagination)
curl "http://localhost:3002/api/products?page=1&limit=10"

# Protected endpoint
curl http://localhost:3002/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman

1. Import the API collection from `/api` endpoint
2. Set environment variable `base_url` = `http://localhost:3002`
3. Set `token` variable after login
4. Use `{{token}}` in Authorization header

### Using Thunder Client (VS Code)

Create a new collection with:
- Base URL: `http://localhost:3002/api`
- Auth header preset: `Bearer {{token}}`

---

## 🚀 Deployment

### Environment Setup

```env
NODE_ENV=production
PORT=3002

# Use production database
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password
DB_NAME=raamul_production

# Strong JWT secret
JWT_SECRET=generate-a-long-random-string-here

# Production M-Pesa
MPESA_ENVIRONMENT=production
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/callback

# Production email
EMAIL_HOST=your-smtp-host
EMAIL_USER=your-smtp-user
EMAIL_PASSWORD=your-smtp-password
```

### Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/server.js --name raamul-api

# View logs
pm2 logs raamul-api

# Restart
pm2 restart raamul-api

# Auto-start on boot
pm2 startup
pm2 save
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.raamul.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Serve uploaded files
    location /uploads {
        alias /path/to/raamulapis/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.raamul.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Error
```
Error: Access denied for user 'root'@'localhost'
```
**Solution:** Check DB_USER and DB_PASSWORD in .env

#### JWT Token Invalid
```
Error: Invalid or expired token
```
**Solution:** Token may have expired. Login again to get a new token.

#### M-Pesa Callback Not Working
```
Payment stays in "pending" status
```
**Solution:** 
1. Ensure callback URL is publicly accessible
2. Check ngrok is running (for local dev)
3. Verify MPESA_CALLBACK_URL in .env

#### Email Not Sending
```
Error: Failed to send email
```
**Solution:**
1. Check EMAIL_* settings in .env
2. For Gmail, use App Password (not regular password)
3. Check spam folder

#### File Upload Failing
```
Error: File too large
```
**Solution:** Max file size is 5MB. Compress images before upload.

### Debug Mode

```bash
# Run with debug logging
DEBUG=* npm run dev

# Or set in .env
NODE_ENV=development
```

### Logs Location

- Development: Console output
- Production (PM2): `~/.pm2/logs/raamul-api-*.log`

---

## 📞 Getting Help

- **GitHub Issues:** Report bugs and feature requests
- **Email:** support@raamul.com
- **Documentation:** See README.md and readm2.md.md

---

**Happy Coding! 🚀**
