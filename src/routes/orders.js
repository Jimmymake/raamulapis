// src/routes/orders.js
import express from "express";
import orderController from "../controllers/orderController.js";
import { authenticateToken, isAdmin } from "../middlewares/rbac.js";
import { 
  validateCreateOrder, 
  validateUpdateOrder, 
  validateIdParam,
  validateOrderIdParam 
} from "../middlewares/validate.js";

const router = express.Router();

// All order routes require authentication

// Users can create their own orders
router.post("/", authenticateToken, validateCreateOrder, orderController.create);

// Admins can view all orders, users can only view their own (filtered in controller)
router.get("/", authenticateToken, orderController.getAll);

// Get order by order_id (must be before /:id)
router.get("/order-id/:order_id", authenticateToken, validateOrderIdParam, orderController.getByOrderId);

// Get orders by customer_id
router.get("/customer/:customer_id", authenticateToken, orderController.getByCustomerId);

// Get order by ID (admins can view any, users only their own)
router.get("/:id", authenticateToken, validateIdParam, orderController.getById);

// Only admins can update orders
router.put("/:id", authenticateToken, isAdmin, validateUpdateOrder, orderController.update);

// Only admins can delete orders
router.delete("/:id", authenticateToken, isAdmin, validateIdParam, orderController.delete);

export default router;
