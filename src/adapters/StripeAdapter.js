const BaseGatewayAdapter = require("./BaseGatewayAdapter");
const stripe = require("stripe");

class StripeAdapter extends BaseGatewayAdapter {
  constructor(config) {
    super(config);
    this.stripe = stripe(config.secretKey);
    this.webhookSecret = config.webhookSecret;
  }

  /**
   * Process a payment using Stripe
   */
  async processPayment(paymentData) {
    try {
      const validation = this.validatePaymentData(paymentData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      let paymentIntent;

      if (paymentData.paymentMethodId) {
        // Create and confirm payment intent with existing payment method
        paymentIntent = await this.stripe.paymentIntents.create({
          amount: paymentData.amount,
          currency: paymentData.currency.toLowerCase(),
          payment_method: paymentData.paymentMethodId,
          confirm: true,
          description:
            paymentData.description || "Payment via Unified Payments API",
          metadata: {
            unified_payment_id: this.generateUnifiedId(),
            customer_email: paymentData.customerEmail,
            ...paymentData.metadata,
          },
        });
      } else if (paymentData.paymentIntentId) {
        // Confirm existing payment intent
        paymentIntent = await this.stripe.paymentIntents.confirm(
          paymentData.paymentIntentId
        );
      } else {
        // Create payment intent without confirming
        paymentIntent = await this.stripe.paymentIntents.create({
          amount: paymentData.amount,
          currency: paymentData.currency.toLowerCase(),
          description:
            paymentData.description || "Payment via Unified Payments API",
          metadata: {
            unified_payment_id: this.generateUnifiedId(),
            customer_email: paymentData.customerEmail,
            ...paymentData.metadata,
          },
        });
      }

      return this.formatResponse({
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        clientSecret: paymentIntent.client_secret,
        requiresAction: paymentIntent.status === "requires_action",
        nextAction: paymentIntent.next_action,
      });
    } catch (error) {
      return this.formatError(error);
    }
  }

  /**
   * Process a refund using Stripe
   */
  async processRefund(refundData) {
    try {
      if (!refundData.paymentIntentId) {
        throw new Error("paymentIntentId is required for refunds");
      }

      const refund = await this.stripe.refunds.create({
        payment_intent: refundData.paymentIntentId,
        amount: refundData.amount || undefined,
        reason: refundData.reason || "requested_by_customer",
        metadata: {
          unified_refund_id: this.generateUnifiedId(),
          reason: refundData.reason,
        },
      });

      return this.formatResponse({
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount,
        currency: refund.currency,
      });
    } catch (error) {
      return this.formatError(error);
    }
  }

  /**
   * Verify Stripe webhook signature
   */
  async verifyWebhook(webhookData) {
    try {
      const { body, signature } = webhookData;

      if (!signature) {
        throw new Error("No signature provided");
      }

      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        this.webhookSecret
      );

      return {
        isValid: true,
        event: event,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Get payment status from Stripe
   */
  async getPaymentStatus(paymentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentId
      );

      return this.formatResponse({
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        created: paymentIntent.created,
        lastPaymentError: paymentIntent.last_payment_error,
      });
    } catch (error) {
      return this.formatError(error);
    }
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(intentData) {
    try {
      const validation = this.validatePaymentData(intentData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: intentData.amount,
        currency: intentData.currency.toLowerCase(),
        description:
          intentData.description || "Payment intent via Unified Payments API",
        metadata: {
          unified_payment_id: this.generateUnifiedId(),
          customer_email: intentData.customerEmail,
          ...intentData.metadata,
        },
      });

      return this.formatResponse({
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
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
      "usd",
      "eur",
      "gbp",
      "cad",
      "aud",
      "jpy",
      "chf",
      "sek",
      "nok",
      "dkk",
      "pln",
      "czk",
      "huf",
      "ron",
      "bgn",
      "hrk",
      "rub",
      "try",
      "brl",
      "mxn",
      "ars",
      "clp",
      "cop",
      "pen",
      "uyu",
      "pyg",
      "bob",
      "ecv",
      "gtq",
      "hnl",
      "nio",
      "crc",
      "pab",
      "vef",
      "dop",
      "jmd",
      "ttd",
      "bbd",
      "bzd",
      "xcd",
      "htg",
      "awg",
      "ang",
      "srd",
      "gyd",
      "fjd",
      "pgk",
      "wst",
      "vuv",
      "top",
      "sbd",
      "kwd",
      "bhd",
      "omr",
      "qar",
      "aed",
      "sar",
      "jod",
      "lbp",
      "egp",
      "mad",
      "tnd",
      "lyd",
      "dzd",
      "mro",
      "mru",
      "ngn",
      "ghs",
      "kes",
      "ugx",
      "tzs",
      "bif",
      "rwf",
      "djf",
      "kmf",
      "mga",
      "mur",
      "scr",
      "szl",
      "zmw",
      "mwk",
      "bwp",
      "naf",
      "szl",
      "ls",
      "stn",
      "aoa",
      "cve",
      "gmd",
      "gnb",
      "gw",
      "mrt",
      "ml",
      "bf",
      "bj",
      "tg",
      "ci",
      "sn",
      "gm",
      "gn",
      "sl",
      "lr",
      "cm",
      "cf",
      "td",
      "ne",
      "sd",
      "er",
      "et",
      "so",
      "dj",
      "yt",
      "km",
      "mg",
      "re",
      "mu",
      "sc",
      "com",
      "km",
      "yt",
      "dj",
      "so",
      "et",
      "er",
      "sd",
      "ne",
      "td",
      "cf",
      "cm",
      "lr",
      "sl",
      "gn",
      "gm",
      "sn",
      "ci",
      "tg",
      "bj",
      "bf",
      "ml",
      "mrt",
      "gw",
      "gnb",
      "gmd",
      "cve",
      "aoa",
    ];
  }

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods() {
    return [
      "card",
      "bank_transfer",
      "sepa_debit",
      "sofort",
      "ideal",
      "bancontact",
      "eps",
      "giropay",
      "p24",
      "alipay",
      "wechat_pay",
      "klarna",
      "affirm",
      "afterpay_clearpay",
    ];
  }
}

module.exports = StripeAdapter;
