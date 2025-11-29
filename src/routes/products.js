// src/routes/products.js
import express from "express";
import productController from "../controllers/productController.js";
import { authenticateToken, isAdmin } from "../middlewares/rbac.js";
import { 
  validateCreateProduct, 
  validateUpdateProduct, 
  validateIdParam 
} from "../middlewares/validate.js";

const router = express.Router();

// Public routes - anyone can view products
router.get("/", productController.getAll);
router.get("/sku/:sku", productController.getBySku);  // Must be before /:id
router.get("/:id", validateIdParam, productController.getById);

// Protected routes - only admins can manage products
router.post("/", authenticateToken, isAdmin, validateCreateProduct, productController.create);
router.put("/:id", authenticateToken, isAdmin, validateUpdateProduct, productController.update);
router.delete("/:id", authenticateToken, isAdmin, validateIdParam, productController.delete);

export default router;
