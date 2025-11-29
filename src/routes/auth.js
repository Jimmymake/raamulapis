// src/routes/auth.js
import express from "express";
import authController from "../controllers/authController.js";
import { authenticateToken } from "../middlewares/rbac.js";
import { validateSignup, validateLogin, validateChangePassword } from "../middlewares/validate.js";
import { body, param } from "express-validator";
import { handleValidationErrors } from "../middlewares/validate.js";

const router = express.Router();

// Public routes
router.post("/signup", validateSignup, authController.signup);
router.post("/login", validateLogin, authController.login);

// Password reset routes (public)
router.post("/forgot-password", 
  body('email').isEmail().withMessage('Valid email is required'),
  handleValidationErrors,
  authController.forgotPassword
);

router.post("/reset-password",
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
  authController.resetPassword
);

router.get("/verify-reset-token/:token",
  param('token').notEmpty().withMessage('Token is required'),
  handleValidationErrors,
  authController.verifyResetToken
);

// Email verification routes
router.get("/verify-email/:token",
  param('token').notEmpty().withMessage('Verification token is required'),
  handleValidationErrors,
  authController.verifyEmail
);

// Protected routes
router.post("/change-password", authenticateToken, validateChangePassword, authController.changePassword);
router.get("/verify", authenticateToken, authController.verifyToken);
router.post("/resend-verification", authenticateToken, authController.resendVerificationEmail);
router.get("/verification-status", authenticateToken, authController.checkVerificationStatus);

export default router;
