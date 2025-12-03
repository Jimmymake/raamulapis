// src/controllers/paymentController.js
import Payment from "../models/paymentModel.js";
import Order from "../models/orderModel.js";
import mpesaService from "../services/mpesaService.js";
import impalaPayService from "../services/impalaPayService.js";
import config from "../config/config.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

// Select payment provider based on config
const paymentProvider = config.paymentProvider || "impala";

class PaymentController {
  // Initiate payment for an order (supports Impala Pay and direct M-Pesa)
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

      let paymentResponse;
      let payment;

      // Use Impala Pay or direct M-Pesa based on config
      if (paymentProvider === "impala") {
        // ===== IMPALA PAY (Mam-Laka) =====
        console.log("Using Impala Pay provider...");
        
        const impalaResponse = await impalaPayService.initiatePayment(
          phone_number,
          amount,
          order_id
        );

        // Save payment record
        payment = await Payment.create({
          order_id: order_id,
          user_id: req.user.id,
          amount: amount,
          phone_number: phone_number,
          merchant_request_id: impalaResponse.merchantRequestId,
          checkout_request_id: impalaResponse.checkoutRequestId || impalaResponse.externalId,
        });

        paymentResponse = {
          message: "Payment initiated successfully. Please check your phone to complete payment.",
          provider: "impala_pay",
          payment: payment,
          response: {
            external_id: impalaResponse.externalId,
            transaction_id: impalaResponse.transactionId,
            checkout_request_id: impalaResponse.checkoutRequestId,
            response_code: impalaResponse.responseCode,
            response_description: impalaResponse.responseDescription,
            customer_message: impalaResponse.customerMessage,
          }
        };

      } else {
        // ===== DIRECT SAFARICOM M-PESA =====
        console.log("Using direct M-Pesa provider...");
        
        const stkResponse = await mpesaService.initiateSTKPush(
          phone_number,
          amount,
          order_id,
          `Payment for order ${order_id}`
        );

        // Save payment record
        payment = await Payment.create({
          order_id: order_id,
          user_id: req.user.id,
          amount: amount,
          phone_number: phone_number,
          merchant_request_id: stkResponse.MerchantRequestID,
          checkout_request_id: stkResponse.CheckoutRequestID,
        });

        paymentResponse = {
          message: "Payment initiated successfully. Please check your phone to complete payment.",
          provider: "mpesa_direct",
          payment: payment,
          response: {
            merchant_request_id: stkResponse.MerchantRequestID,
            checkout_request_id: stkResponse.CheckoutRequestID,
            response_code: stkResponse.ResponseCode,
            response_description: stkResponse.ResponseDescription,
            customer_message: stkResponse.CustomerMessage,
          }
        };
      }

      res.status(200).json(paymentResponse);

    } catch (error) {
      console.error("Payment initiation error:", error);
      res.status(500).json({
        message: "Error initiating payment",
        error: error.message
      });
    }
  }

  // Payment callback handler (supports both Impala Pay and direct M-Pesa)
  async mpesaCallback(req, res) {
    try {
      console.log("Payment Callback received:", JSON.stringify(req.body, null, 2));

      let callbackData;
      
      // Detect callback type (Impala Pay vs Direct M-Pesa)
      if (req.body.Body && req.body.Body.stkCallback) {
        // Direct Safaricom M-Pesa callback
        console.log("Processing Direct M-Pesa callback...");
        callbackData = mpesaService.parseCallbackData(req.body);
      } else {
        // Impala Pay callback
        console.log("Processing Impala Pay callback...");
        callbackData = impalaPayService.parseCallbackData(req.body);
      }
      
      // Find payment by checkout request ID or external ID
      let payment = await Payment.findByCheckoutRequestId(callbackData.checkoutRequestID);
      
      if (!payment && callbackData.externalId) {
        payment = await Payment.findByCheckoutRequestId(callbackData.externalId);
      }
      
      if (!payment) {
        console.error("Payment not found for:", callbackData.checkoutRequestID || callbackData.externalId);
        return res.status(404).json({ message: "Payment record not found" });
      }

      // Update payment status
      const updateData = {
        result_code: callbackData.resultCode,
        result_desc: callbackData.resultDesc,
        callback_data: callbackData,
      };

      if (callbackData.resultCode === 0 || callbackData.status === "SUCCESS") {
        // Payment successful
        updateData.payment_status = 'completed';
        updateData.mpesa_receipt_number = callbackData.mpesaReceiptNumber;
        updateData.transaction_date = callbackData.transactionDate;

        // Update order payment status
        const order = await Order.findByOrderId(payment.order_id);
        if (order) {
          await Order.update(order.id, { 
            order_status: 'confirmed',
            payment: JSON.stringify({
              ...order.payment,
              status: 'completed',
              receipt: callbackData.mpesaReceiptNumber,
              completed_at: new Date().toISOString()
            })
          });
        }
      } else {
        // Payment failed
        updateData.payment_status = 'failed';
      }

      await Payment.updateStatus(payment.checkout_request_id, updateData);

      // Acknowledge callback (format depends on provider)
      res.status(200).json({ 
        ResultCode: 0, 
        ResultDesc: "Success",
        status: "OK" 
      });
    } catch (error) {
      console.error("Callback processing error:", error);
      res.status(500).json({ 
        ResultCode: 1, 
        ResultDesc: "Failed to process callback",
        status: "ERROR"
      });
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