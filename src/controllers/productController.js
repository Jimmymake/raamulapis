import Product from "../models/productModel.js";

class ProductController {
  async create(req, res) {
    try {
      const product = await Product.create(req.body);
      res.status(201).json({ message: "Product created successfully", product });
    } catch (error) {
      res.status(500).json({ message: "Error creating product", error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(200).json({ product });
    } catch (error) {
      res.status(500).json({ message: "Error fetching product", error: error.message });
    }
  }

  async getBySku(req, res) {
    try {
      const { sku } = req.params;
      const product = await Product.findBySku(sku);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(200).json({ product });
    } catch (error) {
      res.status(500).json({ message: "Error fetching product", error: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const filters = {
        category: req.query.category,
        brand: req.query.brand,
        status: req.query.status,
        search: req.query.search,
      };

      const products = await Product.findAll(filters);
      res.status(200).json({ count: products.length, products });
    } catch (error) {
      res.status(500).json({ message: "Error fetching products", error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.update(id, req.body);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(200).json({ message: "Product updated successfully", product });
    } catch (error) {
      res.status(500).json({ message: "Error updating product", error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Product.delete(id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting product", error: error.message });
    }
  }
}

export default new ProductController();

