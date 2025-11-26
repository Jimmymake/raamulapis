import express from "express";
import productController from "../controllers/productController.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

// Public routes
router.get("/", productController.getAll);
router.get("/:id", productController.getById);
router.get("/sku/:sku", productController.getBySku);

// Protected routes - require authentication
router.post("/", authenticateToken, productController.create);
router.put("/:id", authenticateToken, productController.update);
router.delete("/:id", authenticateToken, productController.delete);

export default router;

