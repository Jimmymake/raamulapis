// src/routes/uploads.js
import express from 'express';
import uploadController from '../controllers/uploadController.js';
import { uploadSingle, uploadMultiple, handleUploadError } from '../middlewares/upload.js';
import { authenticateToken, isAdmin } from '../middlewares/rbac.js';

const router = express.Router();

// All upload routes require admin authentication

// Upload single image
router.post(
  '/single',
  authenticateToken,
  isAdmin,
  uploadSingle,
  handleUploadError,
  uploadController.uploadSingle
);

// Upload multiple images (up to 10)
router.post(
  '/multiple',
  authenticateToken,
  isAdmin,
  uploadMultiple,
  handleUploadError,
  uploadController.uploadMultiple
);

// List all uploaded images (admin only)
router.get(
  '/',
  authenticateToken,
  isAdmin,
  uploadController.listImages
);

// Delete an image (admin only)
router.delete(
  '/:filename',
  authenticateToken,
  isAdmin,
  uploadController.deleteImage
);

export default router;


