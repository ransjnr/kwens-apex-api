/**
 * Unified Payments API Client SDK
 * A simple example of how to integrate with the Unified Payments API
 */

class UnifiedPaymentsClient {
  constructor(apiKey, baseUrl = "http://localhost:3001") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    };
  }

  /**
   * Make HTTP request to the API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      method: "GET",
      headers: this.headers,
      ...options,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("API Request failed:", error);
      throw error;
    }
  }

  /**
   * Get available payment gateways
   */
  async getGateways() {
    return this.request("/api/payments/gateways");
  }

  /**
   * Get specific gateway capabilities
   */
  async getGatewayCapabilities(gateway) {
    return this.request(`/api/payments/gateways/${gateway}`);
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(paymentData) {
    return this.request("/api/payments/intent", {
      method: "POST",
      body: paymentData,
    });
  }

  /**
   * Process a payment
   */
  async processPayment(paymentData) {
    return this.request("/api/payments/process", {
      method: "POST",
      body: paymentData,
    });
  }

  /**
   * Process a refund
   */
  async processRefund(refundData) {
    return this.request("/api/payments/refund", {
      method: "POST",
      body: refundData,
    });
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(gateway, paymentId) {
    return this.request(`/api/payments/status/${gateway}/${paymentId}`);
  }

  /**
   * Check system health
   */
  async getHealth() {
    return this.request("/api/health");
  }

  /**
   * Get gateway health status
   */
  async getGatewayHealth() {
    return this.request("/api/health/gateways");
  }
}

// Example usage
async function example() {
  const client = new UnifiedPaymentsClient("your-api-key-here");

  try {
    // Get available gateways
    console.log("Available gateways:");
    const gateways = await client.getGateways();
    console.log(gateways);

    // Create a payment intent with Stripe
    console.log("\nCreating payment intent with Stripe:");
    const paymentIntent = await client.createPaymentIntent({
      gateway: "stripe",
      amount: 1000, // $10.00
      currency: "usd",
      description: "Test payment",
      metadata: {
        orderId: "order_123",
        customerId: "cust_456",
      },
    });
    console.log("Payment Intent:", paymentIntent);

    // Process a payment with Paystack
    console.log("\nProcessing payment with Paystack:");
    const payment = await client.processPayment({
      gateway: "paystack",
      amount: 5000, // ₦50.00 (in kobo)
      currency: "NGN",
      email: "customer@example.com",
      reference: "ref_" + Date.now(),
      callback_url: "https://yourapp.com/callback",
      metadata: {
        orderId: "order_123",
        customerId: "cust_456",
      },
    });
    console.log("Payment:", payment);

    // Check system health
    console.log("\nSystem health:");
    const health = await client.getHealth();
    console.log(health);
  } catch (error) {
    console.error("Example failed:", error.message);
  }
}

// Node.js compatibility
if (typeof module !== "undefined" && module.exports) {
  module.exports = UnifiedPaymentsClient;
} else {
  // Browser compatibility
  window.UnifiedPaymentsClient = UnifiedPaymentsClient;
}

// Run example if this file is executed directly
if (require.main === module) {
  example();
}
