const express = require("express");
const gatewayFactory = require("../factories/GatewayFactory");

const router = express.Router();

/**
 * @route GET /api/health
 * @desc Get overall system health status
 * @access Public
 */
router.get("/", (req, res) => {
  try {
    const startTime = Date.now();

    // Get system information
    const systemInfo = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
    };

    // Get gateway status
    const gatewayStatus = gatewayFactory.validateConfiguration();
    const gatewayStats = gatewayFactory.getGatewayStats();

    // Calculate response time
    const responseTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: "1.0.0",
      system: systemInfo,
      gateways: {
        status: gatewayStatus,
        statistics: gatewayStats,
        totalAvailable: gatewayStats.totalGateways,
      },
      endpoints: {
        payments: "/api/payments",
        webhooks: "/api/webhooks",
        health: "/api/health",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "unhealthy",
      error: "Internal server error",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route GET /api/health/gateways
 * @desc Get detailed gateway health status
 * @access Public
 */
router.get("/gateways", (req, res) => {
  try {
    const availableGateways = gatewayFactory.getAvailableGateways();
    const gatewayDetails = {};

    // Get detailed status for each gateway
    for (const gatewayName of availableGateways) {
      try {
        const gateway = gatewayFactory.getGateway(gatewayName);
        const capabilities = gatewayFactory.getGatewayCapabilities(gatewayName);

        gatewayDetails[gatewayName] = {
          status: "available",
          capabilities: capabilities,
          supportedCurrencies: gateway.getSupportedCurrencies().length,
          supportedPaymentMethods: gateway.getSupportedPaymentMethods().length,
          lastChecked: new Date().toISOString(),
        };
      } catch (error) {
        gatewayDetails[gatewayName] = {
          status: "error",
          error: error.message,
          lastChecked: new Date().toISOString(),
        };
      }
    }

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      totalGateways: availableGateways.length,
      gateways: gatewayDetails,
      summary: {
        available: availableGateways.length,
        errors: Object.values(gatewayDetails).filter(
          (g) => g.status === "error"
        ).length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get gateway health status",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route GET /api/health/performance
 * @desc Get system performance metrics
 * @access Public
 */
router.get("/performance", (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Calculate memory usage percentages
    const totalMemory = require("os").totalmem();
    const freeMemory = require("os").freemem();
    const usedMemory = totalMemory - freeMemory;

    const performanceMetrics = {
      memory: {
        used: {
          bytes: memoryUsage.heapUsed,
          percentage: ((memoryUsage.heapUsed / totalMemory) * 100).toFixed(2),
        },
        total: {
          bytes: totalMemory,
          mb: (totalMemory / 1024 / 1024).toFixed(2),
        },
        free: {
          bytes: freeMemory,
          mb: (freeMemory / 1024 / 1024).toFixed(2),
        },
        system: {
          used: {
            bytes: usedMemory,
            percentage: ((usedMemory / totalMemory) * 100).toFixed(2),
          },
        },
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptime: {
        process: process.uptime(),
        system: require("os").uptime(),
      },
      load: require("os").loadavg(),
      platform: {
        type: require("os").type(),
        release: require("os").release(),
        arch: require("os").arch(),
        cpus: require("os").cpus().length,
      },
    };

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: performanceMetrics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get performance metrics",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route GET /api/health/ready
 * @desc Check if system is ready to handle requests
 * @access Public
 */
router.get("/ready", (req, res) => {
  try {
    const gatewayStatus = gatewayFactory.validateConfiguration();
    const availableGateways = gatewayFactory.getAvailableGateways();

    // System is ready if at least one gateway is available
    const isReady = availableGateways.length > 0;

    if (isReady) {
      res.status(200).json({
        success: true,
        status: "ready",
        message: "System is ready to handle requests",
        timestamp: new Date().toISOString(),
        availableGateways: availableGateways,
        totalGateways: availableGateways.length,
      });
    } else {
      res.status(503).json({
        success: false,
        status: "not_ready",
        message: "No payment gateways are available",
        timestamp: new Date().toISOString(),
        availableGateways: [],
        totalGateways: 0,
      });
    }
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "error",
      message: "System health check failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route GET /api/health/live
 * @desc Simple liveness check
 * @access Public
 */
router.get("/live", (req, res) => {
  res.status(200).json({
    success: true,
    status: "alive",
    timestamp: new Date().toISOString(),
    message: "Service is running",
  });
});

module.exports = router;
