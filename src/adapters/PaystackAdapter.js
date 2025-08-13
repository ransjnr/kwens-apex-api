const BaseGatewayAdapter = require("./BaseGatewayAdapter");

class PaystackAdapter extends BaseGatewayAdapter {
  constructor(config) {
    super(config);
    this.secretKey = config.secretKey;
    this.publicKey = config.publicKey;
    this.baseUrl = "https://api.paystack.co";
  }

  /**
   * Make authenticated request to Paystack API
   */
  async makeRequest(endpoint, method = "GET", data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.secretKey}`,
      "Content-Type": "application/json",
    };

    const options = {
      method,
      headers,
    };

    if (data && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || `Paystack API error: ${response.status}`
        );
      }

      return result;
    } catch (error) {
      throw new Error(`Paystack request failed: ${error.message}`);
    }
  }

  /**
   * Process a payment using Paystack
   */
  async processPayment(paymentData) {
    try {
      const validation = this.validatePaymentData(paymentData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      if (!paymentData.customerEmail) {
        throw new Error("customerEmail is required for Paystack payments");
      }

      // Initialize transaction
      const transactionData = {
        amount: paymentData.amount * 100, // Paystack expects amount in kobo (smallest currency unit)
        email: paymentData.customerEmail,
        currency: paymentData.currency.toUpperCase(),
        reference: this.generateUnifiedId(),
        callback_url:
          paymentData.callbackUrl ||
          `${process.env.BASE_URL}/api/payments/callback`,
        metadata: {
          unified_payment_id: this.generateUnifiedId(),
          customer_email: paymentData.customerEmail,
          ...paymentData.metadata,
        },
      };

      if (paymentData.channel) {
        transactionData.channels = [paymentData.channel];
      }

      const transaction = await this.makeRequest(
        "/transaction/initialize",
        "POST",
        transactionData
      );

      return this.formatResponse({
        transactionId: transaction.data.id,
        reference: transaction.data.reference,
        authorizationUrl: transaction.data.authorization_url,
        accessCode: transaction.data.access_code,
        status: "pending",
        amount: paymentData.amount,
        currency: paymentData.currency,
      });
    } catch (error) {
      return this.formatError(error);
    }
  }

  /**
   * Process a refund using Paystack
   */
  async processRefund(refundData) {
    try {
      if (!refundData.transactionReference) {
        throw new Error(
          "transactionReference is required for Paystack refunds"
        );
      }

      const refundDataPayload = {
        transaction: refundData.transactionReference,
        amount: refundData.amount ? refundData.amount * 100 : undefined,
        reason: refundData.reason || "requested_by_customer",
      };

      const refund = await this.makeRequest(
        "/refund",
        "POST",
        refundDataPayload
      );

      return this.formatResponse({
        refundId: refund.data.id,
        status: refund.data.status,
        amount: refund.data.amount / 100, // Convert back from kobo
        currency: refund.data.currency,
        reference: refund.data.reference,
      });
    } catch (error) {
      return this.formatError(error);
    }
  }

  /**
   * Verify Paystack webhook signature
   */
  async verifyWebhook(webhookData) {
    try {
      const { body, signature } = webhookData;

      if (!signature) {
        throw new Error("No signature provided");
      }

      // Paystack webhook verification
      const crypto = require("crypto");
      const hash = crypto
        .createHmac("sha512", this.secretKey)
        .update(JSON.stringify(body), "utf8")
        .digest("hex");

      if (hash !== signature) {
        throw new Error("Invalid webhook signature");
      }

      return {
        isValid: true,
        event: body,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Get payment status from Paystack
   */
  async getPaymentStatus(paymentReference) {
    try {
      if (!paymentReference) {
        throw new Error("Payment reference is required");
      }

      const transaction = await this.makeRequest(
        `/transaction/verify/${paymentReference}`
      );

      return this.formatResponse({
        status: transaction.data.status,
        amount: transaction.data.amount / 100, // Convert from kobo
        currency: transaction.data.currency,
        reference: transaction.data.reference,
        gateway: transaction.data.gateway,
        channel: transaction.data.channel,
        paidAt: transaction.data.paid_at,
        createdAt: transaction.data.created_at,
      });
    } catch (error) {
      return this.formatError(error);
    }
  }

  /**
   * Create a payment intent (initialize transaction)
   */
  async createPaymentIntent(intentData) {
    try {
      const validation = this.validatePaymentData(intentData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      if (!intentData.customerEmail) {
        throw new Error(
          "customerEmail is required for Paystack payment intents"
        );
      }

      const transactionData = {
        amount: intentData.amount * 100,
        email: intentData.customerEmail,
        currency: intentData.currency.toUpperCase(),
        reference: this.generateUnifiedId(),
        callback_url:
          intentData.callbackUrl ||
          `${process.env.BASE_URL}/api/payments/callback`,
        metadata: {
          unified_payment_id: this.generateUnifiedId(),
          customer_email: intentData.customerEmail,
          ...intentData.metadata,
        },
      };

      const transaction = await this.makeRequest(
        "/transaction/initialize",
        "POST",
        transactionData
      );

      return this.formatResponse({
        transactionId: transaction.data.id,
        reference: transaction.data.reference,
        authorizationUrl: transaction.data.authorization_url,
        accessCode: transaction.data.access_code,
        status: "pending",
        amount: intentData.amount,
        currency: intentData.currency,
      });
    } catch (error) {
      return this.formatError(error);
    }
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies() {
    return [
      "NGN",
      "GHS",
      "ZAR",
      "USD",
      "EUR",
      "GBP",
      "KES",
      "UGX",
      "TZS",
      "ZMW",
      "MAD",
      "EGP",
      "XOF",
      "XAF",
      "CDF",
      "RWF",
      "BIF",
      "DJF",
      "KMF",
      "MGA",
      "MUR",
      "SCR",
      "SZL",
      "MWK",
      "BWP",
      "NAD",
      "LSL",
      "STN",
      "AOA",
      "CVE",
      "GMD",
      "GNF",
      "GW",
      "MRT",
      "ML",
      "BF",
      "BJ",
      "TG",
      "CI",
      "SN",
      "GM",
      "GN",
      "SL",
      "LR",
      "CM",
      "CF",
      "TD",
      "NE",
      "SD",
      "ER",
      "ET",
      "SO",
      "DJ",
      "YT",
      "KM",
      "MG",
      "RE",
      "MU",
      "SC",
      "COM",
    ];
  }

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods() {
    return [
      "card",
      "bank",
      "ussd",
      "qr",
      "mobile_money",
      "bank_transfer",
      "payattitude",
      "paga",
      "1voucher",
      "gt_bank",
      "internet_banking",
      "cashenvoy",
      "providus_bank",
      "pay_with_bank",
      "pay_with_bank_transfer",
      "standard_bank",
      "zenith_bank",
      "access_bank",
      "gt_bank",
      "first_bank",
      "fidelity_bank",
      "ecobank",
      "stanbic_bank",
      "union_bank",
      "wema_bank",
      "heritage_bank",
      "keystone_bank",
      "polaris_bank",
      "unity_bank",
      "jaiz_bank",
      "stanbic_ibtc_bank",
      "diamond_bank",
      "mainstreet_bank",
      "fcmb_bank",
      "uba_bank",
      "fidelity_bank",
      "ecobank",
      "stanbic_bank",
      "union_bank",
      "wema_bank",
      "heritage_bank",
      "keystone_bank",
      "polaris_bank",
      "unity_bank",
      "jaiz_bank",
      "stanbic_ibtc_bank",
      "diamond_bank",
      "mainstreet_bank",
      "fcmb_bank",
      "uba_bank",
    ];
  }
}

module.exports = PaystackAdapter;
