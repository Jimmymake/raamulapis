// src/controllers/uploadController.js
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads/products');

class UploadController {
  // Upload single image
  async uploadSingle(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const imageUrl = `/uploads/products/${req.file.filename}`;
      
      res.status(201).json({
        message: 'Image uploaded successfully',
        image: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          url: imageUrl
        }
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error uploading image', 
        error: error.message 
      });
    }
  }

  // Upload multiple images
  async uploadMultiple(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const images = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: `/uploads/products/${file.filename}`
      }));
      
      res.status(201).json({
        message: `${images.length} image(s) uploaded successfully`,
        images: images
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error uploading images', 
        error: error.message 
      });
    }
  }

  // Delete an image
  async deleteImage(req, res) {
    try {
      const { filename } = req.params;
      
      // Prevent directory traversal
      if (filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ message: 'Invalid filename' });
      }

      const filePath = path.join(uploadsDir, filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // Delete the file
      fs.unlinkSync(filePath);
      
      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error deleting image', 
        error: error.message 
      });
    }
  }

  // List all uploaded images
  async listImages(req, res) {
    try {
      const files = fs.readdirSync(uploadsDir);
      
      const images = files
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map(file => {
          const stats = fs.statSync(path.join(uploadsDir, file));
          return {
            filename: file,
            url: `/uploads/products/${file}`,
            size: stats.size,
            uploadedAt: stats.mtime
          };
        })
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

      res.json({
        count: images.length,
        images: images
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error listing images', 
        error: error.message 
      });
    }
  }
}

export default new UploadController();


