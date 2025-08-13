const express = require("express");
const gatewayFactory = require("../factories/GatewayFactory");

const router = express.Router();

/**
 * @route POST /api/webhooks/stripe
 * @desc Handle Stripe webhooks
 * @access Public (webhook endpoint)
 */
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.headers["stripe-signature"];

      if (!signature) {
        return res.status(400).json({
          success: false,
          error: "No signature provided",
        });
      }

      // Get Stripe adapter
      const stripeAdapter = gatewayFactory.getGateway("stripe");

      // Verify webhook
      const verification = await stripeAdapter.verifyWebhook({
        body: req.body,
        signature: signature,
      });

      if (!verification.isValid) {
        return res.status(400).json({
          success: false,
          error: "Invalid webhook signature",
        });
      }

      const event = verification.event;

      // Process different event types
      switch (event.type) {
        case "payment_intent.succeeded":
          console.log("Payment succeeded:", event.data.object.id);
          // Handle successful payment
          break;

        case "payment_intent.payment_failed":
          console.log("Payment failed:", event.data.object.id);
          // Handle failed payment
          break;

        case "charge.refunded":
          console.log("Refund processed:", event.data.object.id);
          // Handle refund
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.status(200).json({
        success: true,
        message: "Webhook processed successfully",
        eventType: event.type,
      });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(400).json({
        success: false,
        error: "Webhook processing failed",
        message: error.message,
      });
    }
  }
);

/**
 * @route POST /api/webhooks/paystack
 * @desc Handle Paystack webhooks
 * @access Public (webhook endpoint)
 */
router.post("/paystack", async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"];

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: "No signature provided",
      });
    }

    // Get Paystack adapter
    const paystackAdapter = gatewayFactory.getGateway("paystack");

    // Verify webhook
    const verification = await paystackAdapter.verifyWebhook({
      body: req.body,
      signature: signature,
    });

    if (!verification.isValid) {
      return res.status(400).json({
        success: false,
        error: "Invalid webhook signature",
      });
    }

    const event = verification.event;

    // Process different event types
    switch (event.event) {
      case "charge.success":
        console.log("Payment succeeded:", event.data.reference);
        // Handle successful payment
        break;

      case "charge.failed":
        console.log("Payment failed:", event.data.reference);
        // Handle failed payment
        break;

      case "transfer.success":
        console.log("Transfer succeeded:", event.data.reference);
        // Handle successful transfer
        break;

      case "refund.processed":
        console.log("Refund processed:", event.data.reference);
        // Handle refund
        break;

      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      eventType: event.event,
    });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    res.status(400).json({
      success: false,
      error: "Webhook processing failed",
      message: error.message,
    });
  }
});

/**
 * @route POST /api/webhooks/unified
 * @desc Unified webhook endpoint that routes to appropriate gateway
 * @access Public (webhook endpoint)
 */
router.post("/unified", async (req, res) => {
  try {
    const { gateway, ...webhookData } = req.body;

    if (!gateway) {
      return res.status(400).json({
        success: false,
        error: "Gateway parameter is required",
      });
    }

    if (!gatewayFactory.isGatewayAvailable(gateway)) {
      return res.status(400).json({
        success: false,
        error: `Gateway '${gateway}' is not supported`,
      });
    }

    const gatewayAdapter = gatewayFactory.getGateway(gateway);

    // Get signature from appropriate header
    let signature;
    if (gateway === "stripe") {
      signature = req.headers["stripe-signature"];
    } else if (gateway === "paystack") {
      signature = req.headers["x-paystack-signature"];
    }

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: "No signature provided",
      });
    }

    // Verify webhook
    const verification = await gatewayAdapter.verifyWebhook({
      body: req.body,
      signature: signature,
    });

    if (!verification.isValid) {
      return res.status(400).json({
        success: false,
        error: "Invalid webhook signature",
      });
    }

    const event = verification.event;

    // Process webhook based on gateway
    if (gateway === "stripe") {
      // Handle Stripe events
      switch (event.type) {
        case "payment_intent.succeeded":
          console.log("Stripe payment succeeded:", event.data.object.id);
          break;
        case "payment_intent.payment_failed":
          console.log("Stripe payment failed:", event.data.object.id);
          break;
        default:
          console.log(`Unhandled Stripe event: ${event.type}`);
      }
    } else if (gateway === "paystack") {
      // Handle Paystack events
      switch (event.event) {
        case "charge.success":
          console.log("Paystack payment succeeded:", event.data.reference);
          break;
        case "charge.failed":
          console.log("Paystack payment failed:", event.data.reference);
          break;
        default:
          console.log(`Unhandled Paystack event: ${event.event}`);
      }
    }

    res.status(200).json({
      success: true,
      message: "Unified webhook processed successfully",
      gateway: gateway,
      eventType: event.type || event.event,
    });
  } catch (error) {
    console.error("Unified webhook error:", error);
    res.status(400).json({
      success: false,
      error: "Webhook processing failed",
      message: error.message,
    });
  }
});

/**
 * @route GET /api/webhooks/health
 * @desc Get webhook system health status
 * @access Public
 */
router.get("/health", (req, res) => {
  try {
    const availableGateways = gatewayFactory.getAvailableGateways();

    res.status(200).json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      availableWebhookEndpoints: availableGateways.map(
        (gateway) => `/api/webhooks/${gateway}`
      ),
      unifiedEndpoint: "/api/webhooks/unified",
      totalGateways: availableGateways.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "unhealthy",
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
