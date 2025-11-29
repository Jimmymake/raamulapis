// src/routes/payments.js
import express from "express";
import paymentController from "../controllers/paymentController.js";
import { authenticateToken, isAdmin } from "../middlewares/rbac.js";
import { validateInitiatePayment, validateIdParam } from "../middlewares/validate.js";

const router = express.Router();

// Public callback endpoint (M-Pesa will call this)
router.post("/callback", paymentController.mpesaCallback);

// Protected routes - require authentication

// Initiate payment for an order
router.post("/initiate", authenticateToken, validateInitiatePayment, paymentController.initiatePayment);

// Get all payments (filtered by user role)
router.get("/", authenticateToken, paymentController.getAllPayments);

// Specific routes MUST come before /:id to avoid route conflicts
// Get payment statistics (Admin only)
router.get("/statistics/all", authenticateToken, isAdmin, paymentController.getPaymentStats);

// Check payment status by checkout request ID
router.get("/status/:checkout_request_id", authenticateToken, paymentController.checkPaymentStatus);

// Get payments for a specific order
router.get("/order/:order_id", authenticateToken, paymentController.getOrderPayments);

// Get user's payment history
router.get("/user/:user_id", authenticateToken, paymentController.getUserPayments);

// Cancel pending payment (must be before /:id)
router.patch("/:id/cancel", authenticateToken, validateIdParam, paymentController.cancelPayment);

// Get payment by ID (generic param route last)
router.get("/:id", authenticateToken, validateIdParam, paymentController.getPaymentById);

export default router;
