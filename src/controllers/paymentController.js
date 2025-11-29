// src/controllers/paymentController.js
import Payment from "../models/paymentModel.js";
import Order from "../models/orderModel.js";
import mpesaService from "../services/mpesaService.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

class PaymentController {
  // Initiate M-Pesa payment for an order
  async initiatePayment(req, res) {
    try {
      const { order_id, phone_number } = req.body;

      if (!order_id || !phone_number) {
        return res.status(400).json({
          message: "Order ID and phone number are required"
        });
      }

      // Get order details
      const order = await Order.findByOrderId(order_id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user owns the order (unless admin)
      if (req.user.role === 'user' && order.customer_id !== req.user.id.toString()) {
        return res.status(403).json({
          message: "You can only pay for your own orders"
        });
      }

      // Check if order is already paid
      const existingPayments = await Payment.findByOrderId(order_id);
      const completedPayment = existingPayments.find(p => p.payment_status === 'completed');
      
      if (completedPayment) {
        return res.status(400).json({
          message: "This order has already been paid",
          payment: completedPayment
        });
      }

      // Get amount from order pricing
      const amount = order.pricing?.total || 0;
      if (amount <= 0) {
        return res.status(400).json({ message: "Invalid order amount" });
      }

      // Initiate STK push
      const stkResponse = await mpesaService.initiateSTKPush(
        phone_number,
        amount,
        order_id,
        `Payment for order ${order_id}`
      );

      // Save payment record
      const payment = await Payment.create({
        order_id: order_id,
        user_id: req.user.id,
        amount: amount,
        phone_number: phone_number,
        merchant_request_id: stkResponse.MerchantRequestID,
        checkout_request_id: stkResponse.CheckoutRequestID,
      });

      res.status(200).json({
        message: "Payment initiated successfully. Please check your phone to complete payment.",
        payment: payment,
        mpesa_response: {
          merchant_request_id: stkResponse.MerchantRequestID,
          checkout_request_id: stkResponse.CheckoutRequestID,
          response_code: stkResponse.ResponseCode,
          response_description: stkResponse.ResponseDescription,
          customer_message: stkResponse.CustomerMessage,
        }
      });
    } catch (error) {
      console.error("Payment initiation error:", error);
      res.status(500).json({
        message: "Error initiating payment",
        error: error.message
      });
    }
  }

  // M-Pesa callback handler
  async mpesaCallback(req, res) {
    try {
      console.log("M-Pesa Callback received:", JSON.stringify(req.body, null, 2));

      const callbackData = mpesaService.parseCallbackData(req.body);
      
      // Find payment by checkout request ID
      const payment = await Payment.findByCheckoutRequestId(callbackData.checkoutRequestID);
      
      if (!payment) {
        console.error("Payment not found for checkout request:", callbackData.checkoutRequestID);
        return res.status(404).json({ message: "Payment record not found" });
      }

      // Update payment status
      const updateData = {
        result_code: callbackData.resultCode,
        result_desc: callbackData.resultDesc,
        callback_data: callbackData,
      };

      if (callbackData.resultCode === 0) {
        // Payment successful
        updateData.payment_status = 'completed';
        updateData.mpesa_receipt_number = callbackData.mpesaReceiptNumber;
        updateData.transaction_date = callbackData.transactionDate;

        // Update order status to processing
        await Order.update(payment.order_id, { order_status: 'processing' });
      } else {
        // Payment failed
        updateData.payment_status = 'failed';
      }

      await Payment.updateStatus(callbackData.checkoutRequestID, updateData);

      // Acknowledge callback
      res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
    } catch (error) {
      console.error("Callback processing error:", error);
      res.status(500).json({ ResultCode: 1, ResultDesc: "Failed to process callback" });
    }
  }

  // Check payment status
  async checkPaymentStatus(req, res) {
    try {
      const { checkout_request_id } = req.params;

      const payment = await Payment.findByCheckoutRequestId(checkout_request_id);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Check if user owns the payment (unless admin)
      if (req.user.role === 'user' && payment.user_id !== req.user.id) {
        return res.status(403).json({
          message: "You can only check your own payment status"
        });
      }

      // Query M-Pesa for latest status if still pending
      if (payment.payment_status === 'pending') {
        try {
          const stkStatus = await mpesaService.queryStkPushStatus(checkout_request_id);
          
          if (stkStatus.ResultCode === "0") {
            // Update to completed if successful
            await Payment.updateStatus(checkout_request_id, {
              payment_status: 'completed',
              result_code: 0,
              result_desc: stkStatus.ResultDesc,
            });
            
            // Refresh payment data
            const updatedPayment = await Payment.findByCheckoutRequestId(checkout_request_id);
            return res.json({
              message: "Payment completed",
              payment: updatedPayment
            });
          }
        } catch (error) {
          console.error("STK query error:", error);
        }
      }

      res.json({ payment });
    } catch (error) {
      console.error("Status check error:", error);
      res.status(500).json({
        message: "Error checking payment status",
        error: error.message
      });
    }
  }

  // Get all payments (admin can see all, users see their own)
  async getAllPayments(req, res) {
    try {
      const filters = {
        payment_status: req.query.payment_status,
        order_id: req.query.order_id,
        phone_number: req.query.phone_number,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
      };

      // Regular users can only see their own payments
      if (req.user.role === 'user') {
        filters.user_id = req.user.id;
      } else if (req.query.user_id) {
        filters.user_id = req.query.user_id;
      }

      const { page, limit, offset } = parsePagination(req.query);
      const { payments, total } = await Payment.findAll(filters, { limit, offset });
      
      res.json({
        payments,
        pagination: buildPaginationMeta(total, page, limit)
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching payments",
        error: error.message
      });
    }
  }

  // Get payment by ID
  async getPaymentById(req, res) {
    try {
      const { id } = req.params;
      const payment = await Payment.findById(id);

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Regular users can only view their own payments
      if (req.user.role === 'user' && payment.user_id !== req.user.id) {
        return res.status(403).json({
          message: "You can only view your own payments"
        });
      }

      res.json({ payment });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching payment",
        error: error.message
      });
    }
  }

  // Get payments for a specific order
  async getOrderPayments(req, res) {
    try {
      const { order_id } = req.params;

      // Check if order exists
      const order = await Order.findByOrderId(order_id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Regular users can only view payments for their own orders
      if (req.user.role === 'user' && order.customer_id !== req.user.id.toString()) {
        return res.status(403).json({
          message: "You can only view payments for your own orders"
        });
      }

      const payments = await Payment.findByOrderId(order_id);
      
      res.json({
        count: payments.length,
        payments: payments
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching order payments",
        error: error.message
      });
    }
  }

  // Get user's payment history
  async getUserPayments(req, res) {
    try {
      const { user_id } = req.params;

      // Regular users can only view their own payments
      if (req.user.role === 'user' && req.user.id !== parseInt(user_id)) {
        return res.status(403).json({
          message: "You can only view your own payment history"
        });
      }

      const filters = req.query;
      const payments = await Payment.findByUserId(user_id, filters);
      
      res.json({
        count: payments.length,
        payments: payments
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching user payments",
        error: error.message
      });
    }
  }

  // Get payment statistics (Admin only)
  async getPaymentStats(req, res) {
    try {
      const { user_id } = req.query;
      const stats = await Payment.getStatistics(user_id || null);
      
      res.json({ statistics: stats });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching payment statistics",
        error: error.message
      });
    }
  }

  // Cancel pending payment
  async cancelPayment(req, res) {
    try {
      const { id } = req.params;
      const payment = await Payment.findById(id);

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Check ownership
      if (req.user.role === 'user' && payment.user_id !== req.user.id) {
        return res.status(403).json({
          message: "You can only cancel your own payments"
        });
      }

      if (payment.payment_status !== 'pending') {
        return res.status(400).json({
          message: `Cannot cancel payment with status: ${payment.payment_status}`
        });
      }

      await Payment.updateStatus(payment.checkout_request_id, {
        payment_status: 'cancelled',
        result_desc: 'Cancelled by user'
      });

      res.json({ message: "Payment cancelled successfully" });
    } catch (error) {
      res.status(500).json({
        message: "Error cancelling payment",
        error: error.message
      });
    }
  }
}

export default new PaymentController();