const express = require("express");
const { body, validationResult } = require("express-validator");
const gatewayFactory = require("../factories/GatewayFactory");
const { validateApiKey } = require("../middleware/auth");

const router = express.Router();

/**
 * @route POST /api/payments/process
 * @desc Process a payment through specified gateway
 * @access Private
 */
router.post(
  "/process",
  validateApiKey,
  [
    body("gateway")
      .isIn(["stripe", "paystack"])
      .withMessage("Gateway must be stripe or paystack"),
    body("amount")
      .isFloat({ min: 0.01 })
      .withMessage("Amount must be greater than 0"),
    body("currency")
      .isLength({ min: 3, max: 3 })
      .withMessage("Currency must be 3 characters"),
    body("customerEmail")
      .optional()
      .isEmail()
      .withMessage("Invalid email format"),
    body("description")
      .optional()
      .isString()
      .withMessage("Description must be a string"),
    body("metadata")
      .optional()
      .isObject()
      .withMessage("Metadata must be an object"),
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { gateway, ...paymentData } = req.body;

      // Check if gateway is available
      if (!gatewayFactory.isGatewayAvailable(gateway)) {
        return res.status(400).json({
          success: false,
          error: `Gateway '${gateway}' is not available or not configured`,
        });
      }

      // Get gateway adapter
      const gatewayAdapter = gatewayFactory.getGateway(gateway);

      // Process payment
      const result = await gatewayAdapter.processPayment(paymentData);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: error.message,
      });
    }
  }
);

/**
 * @route POST /api/payments/intent
 * @desc Create a payment intent
 * @access Private
 */
router.post(
  "/intent",
  validateApiKey,
  [
    body("gateway")
      .isIn(["stripe", "paystack"])
      .withMessage("Gateway must be stripe or paystack"),
    body("amount")
      .isFloat({ min: 0.01 })
      .withMessage("Amount must be greater than 0"),
    body("currency")
      .isLength({ min: 3, max: 3 })
      .withMessage("Currency must be 3 characters"),
    body("customerEmail")
      .optional()
      .isEmail()
      .withMessage("Invalid email format"),
    body("description")
      .optional()
      .isString()
      .withMessage("Description must be a string"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { gateway, ...intentData } = req.body;

      if (!gatewayFactory.isGatewayAvailable(gateway)) {
        return res.status(400).json({
          success: false,
          error: `Gateway '${gateway}' is not available`,
        });
      }

      const gatewayAdapter = gatewayFactory.getGateway(gateway);
      const result = await gatewayAdapter.createPaymentIntent(intentData);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: error.message,
      });
    }
  }
);

/**
 * @route POST /api/payments/refund
 * @desc Process a refund
 * @access Private
 */
router.post(
  "/refund",
  validateApiKey,
  [
    body("gateway")
      .isIn(["stripe", "paystack"])
      .withMessage("Gateway must be stripe or paystack"),
    body("amount")
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage("Amount must be greater than 0"),
    body("reason").optional().isString().withMessage("Reason must be a string"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { gateway, ...refundData } = req.body;

      if (!gatewayFactory.isGatewayAvailable(gateway)) {
        return res.status(400).json({
          success: false,
          error: `Gateway '${gateway}' is not available`,
        });
      }

      const gatewayAdapter = gatewayFactory.getGateway(gateway);
      const result = await gatewayAdapter.processRefund(refundData);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: error.message,
      });
    }
  }
);

/**
 * @route GET /api/payments/status/:gateway/:paymentId
 * @desc Get payment status
 * @access Private
 */
router.get("/status/:gateway/:paymentId", validateApiKey, async (req, res) => {
  try {
    const { gateway, paymentId } = req.params;

    if (!gatewayFactory.isGatewayAvailable(gateway)) {
      return res.status(400).json({
        success: false,
        error: `Gateway '${gateway}' is not available`,
      });
    }

    const gatewayAdapter = gatewayFactory.getGateway(gateway);
    const result = await gatewayAdapter.getPaymentStatus(paymentId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * @route GET /api/payments/gateways
 * @desc Get available gateways and their capabilities
 * @access Public
 */
router.get("/gateways", (req, res) => {
  try {
    const capabilities = gatewayFactory.getAllGatewayCapabilities();
    const stats = gatewayFactory.getGatewayStats();

    res.status(200).json({
      success: true,
      data: {
        capabilities,
        statistics: stats,
        totalGateways: stats.totalGateways,
        availableGateways: stats.availableGateways,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * @route GET /api/payments/gateways/:gateway
 * @desc Get specific gateway capabilities
 * @access Public
 */
router.get("/gateways/:gateway", (req, res) => {
  try {
    const { gateway } = req.params;

    if (!gatewayFactory.isGatewayAvailable(gateway)) {
      return res.status(404).json({
        success: false,
        error: `Gateway '${gateway}' not found`,
      });
    }

    const capabilities = gatewayFactory.getGatewayCapabilities(gateway);

    res.status(200).json({
      success: true,
      data: capabilities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * @route GET /api/payments/health
 * @desc Get payment system health status
 * @access Public
 */
router.get("/health", (req, res) => {
  try {
    const configStatus = gatewayFactory.validateConfiguration();
    const stats = gatewayFactory.getGatewayStats();

    res.status(200).json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      configuration: configStatus,
      statistics: stats,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: "1.0.0",
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
