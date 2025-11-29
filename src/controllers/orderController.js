// src/controllers/orderController.js
import Order from "../models/orderModel.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

class OrderController {
  async create(req, res) {
    try {
      const orderData = req.body;

      // Automatically set customer_id to logged-in user if not admin
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        orderData.customer_id = req.user.id.toString();
      }

      const order = await Order.create(orderData);
      res.status(201).json({ message: "Order created successfully", order });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Error creating order", error: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const filters = {
        order_status: req.query.order_status,
        search: req.query.search,
      };

      // Regular users can only see their own orders
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        filters.customer_id = req.user.id.toString();
      } else if (req.query.customer_id) {
        filters.customer_id = req.query.customer_id;
      }

      const { page, limit, offset } = parsePagination(req.query);
      const { orders, total } = await Order.findAll(filters, { limit, offset });
      
      res.json({ 
        orders,
        pagination: buildPaginationMeta(total, page, limit)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Regular users can only view their own orders
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        if (order.customer_id !== req.user.id.toString()) {
          return res.status(403).json({ 
            message: "Access denied. You can only view your own orders." 
          });
        }
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getByOrderId(req, res) {
    try {
      const order = await Order.findByOrderId(req.params.order_id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Regular users can only view their own orders
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        if (order.customer_id !== req.user.id.toString()) {
          return res.status(403).json({ 
            message: "Access denied. You can only view your own orders." 
          });
        }
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getByCustomerId(req, res) {
    try {
      const { customer_id } = req.params;

      // Regular users can only view their own orders
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        if (customer_id !== req.user.id.toString()) {
          return res.status(403).json({ 
            message: "Access denied. You can only view your own orders." 
          });
        }
      }

      const orders = await Order.findByCustomerId(customer_id);
      res.json({ count: orders.length, orders });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const order = await Order.update(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json({ message: "Order updated successfully", order });
    } catch (error) {
      res.status(500).json({ message: "Error updating order", error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const success = await Order.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new OrderController();