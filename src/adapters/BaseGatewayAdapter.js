/**
 * Base Gateway Adapter Interface
 * All payment gateway adapters must implement these methods
 */
class BaseGatewayAdapter {
  constructor(config) {
    this.config = config;
    this.gatewayName = this.constructor.name;
  }

  /**
   * Process a payment
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} Payment result
   */
  async processPayment(paymentData) {
    throw new Error(`${this.gatewayName} must implement processPayment method`);
  }

  /**
   * Process a refund
   * @param {Object} refundData - Refund information
   * @returns {Promise<Object>} Refund result
   */
  async processRefund(refundData) {
    throw new Error(`${this.gatewayName} must implement processRefund method`);
  }

  /**
   * Verify a webhook signature
   * @param {Object} webhookData - Webhook data and headers
   * @returns {Promise<boolean>} Verification result
   */
  async verifyWebhook(webhookData) {
    throw new Error(`${this.gatewayName} must implement verifyWebhook method`);
  }

  /**
   * Get payment status
   * @param {string} paymentId - Payment identifier
   * @returns {Promise<Object>} Payment status
   */
  async getPaymentStatus(paymentId) {
    throw new Error(
      `${this.gatewayName} must implement getPaymentStatus method`
    );
  }

  /**
   * Create a payment intent (for card payments)
   * @param {Object} intentData - Intent data
   * @returns {Promise<Object>} Payment intent
   */
  async createPaymentIntent(intentData) {
    throw new Error(
      `${this.gatewayName} must implement createPaymentIntent method`
    );
  }

  /**
   * Validate payment data
   * @param {Object} paymentData - Payment data to validate
   * @returns {Object} Validation result
   */
  validatePaymentData(paymentData) {
    const required = ["amount", "currency"];
    const missing = required.filter((field) => !paymentData[field]);

    if (missing.length > 0) {
      return {
        isValid: false,
        errors: missing.map((field) => `${field} is required`),
      };
    }

    if (paymentData.amount <= 0) {
      return {
        isValid: false,
        errors: ["amount must be greater than 0"],
      };
    }

    return { isValid: true, errors: [] };
  }

  /**
   * Format unified response
   * @param {Object} gatewayResponse - Response from payment gateway
   * @returns {Object} Unified response format
   */
  formatResponse(gatewayResponse) {
    return {
      success: true,
      gateway: this.gatewayName.toLowerCase(),
      gatewayResponse,
      timestamp: new Date().toISOString(),
      unifiedId: this.generateUnifiedId(),
    };
  }

  /**
   * Format error response
   * @param {Error} error - Error object
   * @returns {Object} Unified error format
   */
  formatError(error) {
    return {
      success: false,
      gateway: this.gatewayName.toLowerCase(),
      error: {
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
        details: error.details || null,
      },
      timestamp: new Date().toISOString(),
      unifiedId: this.generateUnifiedId(),
    };
  }

  /**
   * Generate unified transaction ID
   * @returns {string} Unique transaction ID
   */
  generateUnifiedId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `unified_${this.gatewayName.toLowerCase()}_${timestamp}_${random}`;
  }

  /**
   * Get supported currencies
   * @returns {Array} List of supported currencies
   */
  getSupportedCurrencies() {
    throw new Error(
      `${this.gatewayName} must implement getSupportedCurrencies method`
    );
  }

  /**
   * Get supported payment methods
   * @returns {Array} List of supported payment methods
   */
  getSupportedPaymentMethods() {
    throw new Error(
      `${this.gatewayName} must implement getSupportedPaymentMethods method`
    );
  }
}

module.exports = BaseGatewayAdapter;
