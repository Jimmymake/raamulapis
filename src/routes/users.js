// src/routes/users.js
import express from "express";
import userController from "../controllers/userController.js";
import { authenticateToken, isAdmin, isSuperAdmin } from "../middlewares/rbac.js";
import { 
  validateCreateUser, 
  validateUpdateUser, 
  validateUserStatus,
  validateIdParam 
} from "../middlewares/validate.js";

const router = express.Router();

// Get user statistics (Admin only)
router.get("/stats", authenticateToken, isAdmin, userController.getStats);

// Get current user profile
router.get("/profile", authenticateToken, userController.getProfile);

// Get all users (Admin only)
router.get("/", authenticateToken, isAdmin, userController.getAll);

// Create new user (Admin only)
router.post("/", authenticateToken, isAdmin, validateCreateUser, userController.createUser);

// Get user by ID (Admin or owner)
router.get("/:id", authenticateToken, validateIdParam, userController.getById);

// Update user (Admin or owner)
router.put("/:id", authenticateToken, validateUpdateUser, userController.update);

// Change user status (Admin only)
router.patch("/:id/status", authenticateToken, isAdmin, validateUserStatus, userController.changeStatus);

// Delete user (Super admin only)
router.delete("/:id", authenticateToken, isSuperAdmin, validateIdParam, userController.delete);

export default router;
