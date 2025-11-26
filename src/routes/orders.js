import express from "express";
import orderController from "../controllers/orderController.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

// All order routes require authentication
router.post("/", authenticateToken, orderController.create);
router.get("/", authenticateToken, orderController.getAll);
router.get("/:id", authenticateToken, orderController.getById);
router.get("/order-id/:order_id", authenticateToken, orderController.getByOrderId);
router.get("/customer/:customer_id", authenticateToken, orderController.getByCustomerId);
router.put("/:id", authenticateToken, orderController.update);
router.delete("/:id", authenticateToken, orderController.delete);

export default router;

