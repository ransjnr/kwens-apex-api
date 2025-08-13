const StripeAdapter = require("../adapters/StripeAdapter");
const PaystackAdapter = require("../adapters/PaystackAdapter");

/**
 * Gateway Factory - Manages payment gateway adapters
 */
class GatewayFactory {
  constructor() {
    this.adapters = new Map();
    this.initializeAdapters();
  }

  /**
   * Initialize all available payment gateway adapters
   */
  initializeAdapters() {
    // Initialize Stripe adapter
    if (process.env.STRIPE_SECRET_KEY) {
      this.adapters.set(
        "stripe",
        new StripeAdapter({
          secretKey: process.env.STRIPE_SECRET_KEY,
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        })
      );
    }

    // Initialize Paystack adapter
    if (process.env.PAYSTACK_SECRET_KEY) {
      this.adapters.set(
        "paystack",
        new PaystackAdapter({
          secretKey: process.env.PAYSTACK_SECRET_KEY,
          publicKey: process.env.PAYSTACK_PUBLIC_KEY,
        })
      );
    }
  }

  /**
   * Get a payment gateway adapter by name
   * @param {string} gatewayName - Name of the gateway (stripe, paystack, etc.)
   * @returns {BaseGatewayAdapter} Gateway adapter instance
   */
  getGateway(gatewayName) {
    const normalizedName = gatewayName.toLowerCase();

    if (!this.adapters.has(normalizedName)) {
      throw new Error(`Unsupported payment gateway: ${gatewayName}`);
    }

    return this.adapters.get(normalizedName);
  }

  /**
   * Get all available gateways
   * @returns {Array} List of available gateway names
   */
  getAvailableGateways() {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if a gateway is available
   * @param {string} gatewayName - Name of the gateway
   * @returns {boolean} True if gateway is available
   */
  isGatewayAvailable(gatewayName) {
    const normalizedName = gatewayName.toLowerCase();
    return this.adapters.has(normalizedName);
  }

  /**
   * Get gateway capabilities
   * @param {string} gatewayName - Name of the gateway
   * @returns {Object} Gateway capabilities
   */
  getGatewayCapabilities(gatewayName) {
    const gateway = this.getGateway(gatewayName);

    return {
      name: gatewayName,
      supportedCurrencies: gateway.getSupportedCurrencies(),
      supportedPaymentMethods: gateway.getSupportedPaymentMethods(),
      features: {
        refunds: true,
        webhooks: true,
        paymentIntents: true,
        statusChecking: true,
      },
    };
  }

  /**
   * Get all gateway capabilities
   * @returns {Object} All gateway capabilities
   */
  getAllGatewayCapabilities() {
    const capabilities = {};

    for (const [name, adapter] of this.adapters) {
      capabilities[name] = this.getGatewayCapabilities(name);
    }

    return capabilities;
  }

  /**
   * Validate gateway configuration
   * @returns {Object} Validation result
   */
  validateConfiguration() {
    const errors = [];
    const warnings = [];

    // Check required environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      warnings.push("Stripe is not configured (STRIPE_SECRET_KEY missing)");
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      warnings.push("Paystack is not configured (PAYSTACK_SECRET_KEY missing)");
    }

    if (warnings.length === 0) {
      warnings.push("All supported gateways are configured");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      availableGateways: this.getAvailableGateways(),
    };
  }

  /**
   * Get gateway statistics
   * @returns {Object} Gateway statistics
   */
  getGatewayStats() {
    const stats = {
      totalGateways: this.adapters.size,
      availableGateways: this.getAvailableGateways(),
      configurationStatus: this.validateConfiguration(),
    };

    return stats;
  }
}

// Create singleton instance
const gatewayFactory = new GatewayFactory();

module.exports = gatewayFactory;
