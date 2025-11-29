// src/routes/tracking.js
import express from "express";
import orderTrackingController from "../controllers/orderTrackingController.js";
import { authenticateToken, isAdmin } from "../middlewares/rbac.js";
import { validateAddTracking, validateIdParam, validateOrderIdParam } from "../middlewares/validate.js";

const router = express.Router();

// Get all tracking updates (Admin only)
router.get("/", authenticateToken, isAdmin, orderTrackingController.getAllTracking);

// Add new tracking update (Admin only)
router.post("/", authenticateToken, isAdmin, validateAddTracking, orderTrackingController.addTracking);

// Get tracking history for an order (User can track own orders)
router.get("/order/:order_id", authenticateToken, validateOrderIdParam, orderTrackingController.getOrderTracking);

// Get latest tracking status for an order (User can track own orders)
router.get("/order/:order_id/latest", authenticateToken, validateOrderIdParam, orderTrackingController.getLatestTracking);

// Delete tracking entry (Admin only)
router.delete("/:id", authenticateToken, isAdmin, validateIdParam, orderTrackingController.deleteTracking);

export default router;
