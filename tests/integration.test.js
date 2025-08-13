const request = require("supertest");
const app = require("../src/server");

describe("Unified Payments API Integration Tests", () => {
  const testApiKey = "test-api-key-123";

  describe("Health Endpoints", () => {
    test("GET /api/health should return system health", async () => {
      const response = await request(app).get("/api/health").expect(200);

      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
    });

    test("GET /api/health/gateways should return gateway status", async () => {
      const response = await request(app)
        .get("/api/health/gateways")
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("gateways");
    });

    test("GET /api/health/performance should return performance metrics", async () => {
      const response = await request(app)
        .get("/api/health/performance")
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("metrics");
    });
  });

  describe("Gateway Information", () => {
    test("GET /api/payments/gateways should return available gateways", async () => {
      const response = await request(app)
        .get("/api/payments/gateways")
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("capabilities");
      expect(response.body.data.capabilities).toHaveProperty("stripe");
      expect(response.body.data.capabilities).toHaveProperty("paystack");
    });

    test("GET /api/payments/gateways/stripe should return Stripe capabilities", async () => {
      const response = await request(app)
        .get("/api/payments/gateways/stripe")
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("name", "stripe");
      expect(response.body.data).toHaveProperty("supportedCurrencies");
      expect(response.body.data).toHaveProperty("supportedPaymentMethods");
    });

    test("GET /api/payments/gateways/paystack should return Paystack capabilities", async () => {
      const response = await request(app)
        .get("/api/payments/gateways/paystack")
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("name", "paystack");
      expect(response.body.data).toHaveProperty("supportedCurrencies");
      expect(response.body.data).toHaveProperty("supportedPaymentMethods");
    });
  });

  describe("Payment Processing", () => {
    test("POST /api/payments/process should require API key", async () => {
      const response = await request(app)
        .post("/api/payments/process")
        .send({
          gateway: "stripe",
          amount: 1000,
          currency: "usd",
          description: "Test payment",
        })
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body.error).toHaveProperty("message");
    });

    test("POST /api/payments/process should validate required fields", async () => {
      const response = await request(app)
        .post("/api/payments/process")
        .set("x-api-key", testApiKey)
        .send({
          amount: 1000,
          currency: "usd",
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body.error).toHaveProperty("message");
    });

    test("POST /api/payments/intent should create payment intent", async () => {
      const response = await request(app)
        .post("/api/payments/intent")
        .set("x-api-key", testApiKey)
        .send({
          gateway: "stripe",
          amount: 1000,
          currency: "usd",
          description: "Test payment intent",
        })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("paymentIntentId");
      expect(response.body.data).toHaveProperty("clientSecret");
    });
  });

  describe("Webhook Handling", () => {
    test("POST /api/webhooks/stripe should handle Stripe webhooks", async () => {
      const response = await request(app)
        .post("/api/webhooks/stripe")
        .send({
          type: "payment_intent.succeeded",
          data: {
            object: {
              id: "pi_test123",
              amount: 1000,
              currency: "usd",
            },
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
    });

    test("POST /api/webhooks/paystack should handle Paystack webhooks", async () => {
      const response = await request(app)
        .post("/api/webhooks/paystack")
        .send({
          event: "charge.success",
          data: {
            reference: "ref_test123",
            amount: 1000,
            currency: "NGN",
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
    });
  });

  describe("Error Handling", () => {
    test("Should return 404 for non-existent routes", async () => {
      const response = await request(app).get("/api/nonexistent").expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body.error).toHaveProperty("message");
    });

    test("Should handle malformed JSON gracefully", async () => {
      const response = await request(app)
        .post("/api/payments/process")
        .set("Content-Type", "application/json")
        .set("x-api-key", testApiKey)
        .send("invalid json")
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("Rate Limiting", () => {
    test("Should enforce rate limits on payment endpoints", async () => {
      // Make multiple requests to trigger rate limiting
      const promises = Array(15)
        .fill()
        .map(() =>
          request(app)
            .post("/api/payments/process")
            .set("x-api-key", testApiKey)
            .send({
              gateway: "stripe",
              amount: 1000,
              currency: "usd",
              description: "Rate limit test",
            })
        );

      const responses = await Promise.all(promises);
      const rateLimited = responses.some((r) => r.status === 429);

      expect(rateLimited).toBe(true);
    });
  });
});
