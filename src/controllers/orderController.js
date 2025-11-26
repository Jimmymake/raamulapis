// import Order from "../models/orderModel.js";

// class OrderController {
//   async create(req, res) {
//     try {
//       const order = await Order.create(req.body);
//       res.status(201).json({ message: "Order created successfully", order });
//     } catch (error) {
//       res.status(500).json({ message: "Error creating order", error: error.message });
//     }
//   }

//   async getById(req, res) {
//     try {
//       const { id } = req.params;
//       const order = await Order.findById(id);
//       if (!order) {
//         return res.status(404).json({ message: "Order not found" });
//       }
//       res.status(200).json({ order });
//     } catch (error) {
//       res.status(500).json({ message: "Error fetching order", error: error.message });
//     }
//   }

//   async getByOrderId(req, res) {
//     try {
//       const { order_id } = req.params;
//       const order = await Order.findByOrderId(order_id);
//       if (!order) {
//         return res.status(404).json({ message: "Order not found" });
//       }
//       res.status(200).json({ order });
//     } catch (error) {
//       res.status(500).json({ message: "Error fetching order", error: error.message });
//     }
//   }

//   async getByCustomerId(req, res) {
//     try {
//       const { customer_id } = req.params;
//       const orders = await Order.findByCustomerId(customer_id);
//       res.status(200).json({ count: orders.length, orders });
//     } catch (error) {
//       res.status(500).json({ message: "Error fetching orders", error: error.message });
//     }
//   }

//   async getAll(req, res) {
//     try {
//       const filters = {
//         order_status: req.query.status,
//         customer_id: req.query.customer_id,
//         search: req.query.search,
//       };

//       const orders = await Order.findAll(filters);
//       res.status(200).json({ count: orders.length, orders });
//     } catch (error) {
//       res.status(500).json({ message: "Error fetching orders", error: error.message });
//     }
//   }

//   async update(req, res) {
//     try {
//       const { id } = req.params;
//       const order = await Order.update(id, req.body);
//       if (!order) {
//         return res.status(404).json({ message: "Order not found" });
//       }
//       res.status(200).json({ message: "Order updated successfully", order });
//     } catch (error) {
//       res.status(500).json({ message: "Error updating order", error: error.message });
//     }
//   }

//   async delete(req, res) {
//     try {
//       const { id } = req.params;
//       const deleted = await Order.delete(id);
//       if (!deleted) {
//         return res.status(404).json({ message: "Order not found" });
//       }
//       res.status(200).json({ message: "Order deleted successfully" });
//     } catch (error) {
//       res.status(500).json({ message: "Error deleting order", error: error.message });
//     }
//   }
// }

// export default new OrderController();


import Order from "../models/orderModel.js";

class OrderController {
  // async create(req, res) {
  //   try {
  //     const orderData = req.body;

  //     // Ensure JSON fields are properly formatted
  //     if (typeof orderData.customer === "string") {
  //       orderData.customer = JSON.parse(orderData.customer);
  //     }
  //     if (typeof orderData.items === "string") {
  //       orderData.items = JSON.parse(orderData.items);
  //     }
  //     if (typeof orderData.pricing === "string") {
  //       orderData.pricing = JSON.parse(orderData.pricing);
  //     }
  //     if (typeof orderData.shipping === "string") {
  //       orderData.shipping = JSON.parse(orderData.shipping);
  //     }
  //     if (typeof orderData.payment === "string") {
  //       orderData.payment = JSON.parse(orderData.payment);
  //     }

  //     const order = await Order.create(orderData);
  //     res.status(201).json({ message: "Order created successfully", order });
  //   } catch (error) {
  //     console.error("Error creating order:", error);
  //     res.status(500).json({ message: "Error creating order", error: error.message });
  //   }
  // }
  async create(req, res) {
    try {
      const order = await Order.create(req.body);
      res.status(201).json({ message: "Order created successfully", order });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Error creating order", error: error.message });
    }
  }


  async getAll(req, res) {
    try {
      const filters = req.query;
      const orders = await Order.findAll(filters);
      res.json(orders);
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
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getByCustomerId(req, res) {
    try {
      const orders = await Order.findByCustomerId(req.params.customer_id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // async update(req, res) {
  //   try {
  //     const orderData = req.body;

  //     // Ensure JSON fields are properly formatted
  //     if (orderData.customer && typeof orderData.customer === "string") {
  //       orderData.customer = JSON.parse(orderData.customer);
  //     }
  //     if (orderData.items && typeof orderData.items === "string") {
  //       orderData.items = JSON.parse(orderData.items);
  //     }
  //     if (orderData.pricing && typeof orderData.pricing === "string") {
  //       orderData.pricing = JSON.parse(orderData.pricing);
  //     }
  //     if (orderData.shipping && typeof orderData.shipping === "string") {
  //       orderData.shipping = JSON.parse(orderData.shipping);
  //     }
  //     if (orderData.payment && typeof orderData.payment === "string") {
  //       orderData.payment = JSON.parse(orderData.payment);
  //     }

  //     const order = await Order.update(req.params.id, orderData);
  //     res.json({ message: "Order updated successfully", order });
  //   } catch (error) {
  //     res.status(500).json({ message: "Error updating order", error: error.message });
  //   }
  // }
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
