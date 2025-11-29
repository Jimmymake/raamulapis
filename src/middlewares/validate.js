// src/middlewares/validate.js
import { body, param, query, validationResult } from 'express-validator';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: "Validation failed",
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// ==================== AUTH VALIDATION ====================

export const validateSignup = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
    .withMessage('Invalid phone number format'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Location must be less than 255 characters'),
  handleValidationErrors
];

export const validateLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  handleValidationErrors
];

// ==================== USER VALIDATION ====================

export const validateCreateUser = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['user', 'admin', 'super_admin']).withMessage('Invalid role'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  handleValidationErrors
];

export const validateUpdateUser = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format'),
  body('role')
    .optional()
    .isIn(['user', 'admin', 'super_admin']).withMessage('Invalid role'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  handleValidationErrors
];

export const validateUserStatus = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  handleValidationErrors
];

// ==================== PRODUCT VALIDATION ====================

export const validateCreateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 255 }).withMessage('Name must be less than 255 characters'),
  body('sku')
    .trim()
    .notEmpty().withMessage('SKU is required')
    .isLength({ max: 100 }).withMessage('SKU must be less than 100 characters'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters (e.g., KES, USD)'),
  body('status')
    .optional()
    .isIn(['active', 'inactive']).withMessage('Invalid status'),
  body('images')
    .optional()
    .isArray().withMessage('Images must be an array'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  handleValidationErrors
];

export const validateUpdateProduct = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid product ID'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('status')
    .optional()
    .isIn(['active', 'inactive']).withMessage('Invalid status'),
  handleValidationErrors
];

// ==================== ORDER VALIDATION ====================

export const validateCreateOrder = [
  body('order_id')
    .trim()
    .notEmpty().withMessage('Order ID is required')
    .isLength({ max: 100 }).withMessage('Order ID must be less than 100 characters'),
  body('items')
    .notEmpty().withMessage('Items are required')
    .isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.product_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid product ID in items'),
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('pricing')
    .notEmpty().withMessage('Pricing is required')
    .isObject().withMessage('Pricing must be an object'),
  body('pricing.total')
    .notEmpty().withMessage('Total price is required')
    .isFloat({ min: 0 }).withMessage('Total must be a positive number'),
  body('customer')
    .optional()
    .isObject().withMessage('Customer must be an object'),
  body('shipping')
    .optional()
    .isObject().withMessage('Shipping must be an object'),
  body('payment')
    .optional()
    .isObject().withMessage('Payment must be an object'),
  body('order_status')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'])
    .withMessage('Invalid order status'),
  handleValidationErrors
];

export const validateUpdateOrder = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid order ID'),
  body('order_status')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'])
    .withMessage('Invalid order status'),
  handleValidationErrors
];

// ==================== PAYMENT VALIDATION ====================

export const validateInitiatePayment = [
  body('order_id')
    .trim()
    .notEmpty().withMessage('Order ID is required'),
  body('phone_number')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^(0|254|\+254)?[17]\d{8}$/).withMessage('Invalid Kenyan phone number'),
  handleValidationErrors
];

// ==================== TRACKING VALIDATION ====================

export const validateAddTracking = [
  body('order_id')
    .trim()
    .notEmpty().withMessage('Order ID is required'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'])
    .withMessage('Invalid tracking status'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Location must be less than 255 characters'),
  body('notes')
    .optional()
    .trim(),
  handleValidationErrors
];

// ==================== COMMON PARAM VALIDATION ====================

export const validateIdParam = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid ID'),
  handleValidationErrors
];

export const validateOrderIdParam = [
  param('order_id')
    .trim()
    .notEmpty().withMessage('Order ID is required'),
  handleValidationErrors
];
