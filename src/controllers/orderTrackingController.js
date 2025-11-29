// src/controllers/orderTrackingController.js
import OrderTracking from "../models/orderTrackingModel.js";
import Order from "../models/orderModel.js";

class OrderTrackingController {
  // Add new tracking update (Admin only)
  async addTracking(req, res) {
    try {
      const { order_id, status, location, notes } = req.body;

      if (!order_id || !status) {
        return res.status(400).json({
          message: "Order ID and status are required"
        });
      }

      // Verify order exists
      const order = await Order.findByOrderId(order_id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Create tracking entry
      const tracking = await OrderTracking.create({
        order_id,
        status,
        location,
        notes,
        updated_by: req.user.id
      });

      // Update order status as well
      await Order.update(order.id, { order_status: status });

      res.status(201).json({
        message: "Tracking update added successfully",
        tracking
      });
    } catch (error) {
      console.error("Add tracking error:", error);
      res.status(500).json({
        message: "Error adding tracking update",
        error: error.message
      });
    }
  }

  // Get tracking history for an order
  async getOrderTracking(req, res) {
    try {
      const { order_id } = req.params;

      // Verify order exists
      const order = await Order.findByOrderId(order_id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Regular users can only track their own orders
      if (req.user.role === 'user' && order.customer_id !== req.user.id.toString()) {
        return res.status(403).json({
          message: "You can only track your own orders"
        });
      }

      const tracking = await OrderTracking.findByOrderId(order_id);

      res.json({
        order_id,
        tracking_history: tracking,
        current_status: tracking.length > 0 ? tracking[tracking.length - 1] : null
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching order tracking",
        error: error.message
      });
    }
  }

  // Get latest tracking status for an order
  async getLatestTracking(req, res) {
    try {
      const { order_id } = req.params;

      // Verify order exists
      const order = await Order.findByOrderId(order_id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Regular users can only view their own orders
      if (req.user.role === 'user' && order.customer_id !== req.user.id.toString()) {
        return res.status(403).json({
          message: "You can only track your own orders"
        });
      }

      const latestTracking = await OrderTracking.getLatestStatus(order_id);

      if (!latestTracking) {
        return res.status(404).json({
          message: "No tracking information available for this order"
        });
      }

      res.json({
        order_id,
        current_status: latestTracking
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching latest tracking",
        error: error.message
      });
    }
  }

  // Get all tracking updates (Admin only)
  async getAllTracking(req, res) {
    try {
      const filters = req.query;
      const tracking = await OrderTracking.getAllTracking(filters);

      res.json({
        count: tracking.length,
        tracking
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching tracking updates",
        error: error.message
      });
    }
  }

  // Delete tracking entry (Admin only)
  async deleteTracking(req, res) {
    try {
      const { id } = req.params;
      const deleted = await OrderTracking.delete(id);

      if (!deleted) {
        return res.status(404).json({ message: "Tracking entry not found" });
      }

      res.json({ message: "Tracking entry deleted successfully" });
    } catch (error) {
      res.status(500).json({
        message: "Error deleting tracking entry",
        error: error.message
      });
    }
  }
}

export default new OrderTrackingController();