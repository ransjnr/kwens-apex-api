# Unified Payments API Documentation

## Overview

The Unified Payments API provides a single, consistent interface for multiple payment gateways including Stripe and Paystack. This API abstracts the complexity of different payment systems, allowing you to process payments, handle refunds, and manage webhooks through a unified interface.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://your-domain.com`

## Authentication

All API requests require authentication using an API key. Include your API key in the request headers:

```http
x-api-key: your-api-key-here
```

Or using the Authorization header:

```http
Authorization: Bearer your-api-key-here
```

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Payment endpoints**: 10 requests per minute per IP
- **Webhook endpoints**: No rate limiting

## Endpoints

### 1. Health & Monitoring

#### GET /api/health
Get overall system health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "development"
}
```

#### GET /api/health/gateways
Get detailed health status of all payment gateways.

**Response:**
```json
{
  "success": true,
  "data": {
    "gateways": {
      "stripe": {
        "status": "healthy",
        "responseTime": 45,
        "lastChecked": "2024-01-15T10:30:00.000Z"
      },
      "paystack": {
        "status": "healthy",
        "responseTime": 67,
        "lastChecked": "2024-01-15T10:30:00.000Z"
      }
    }
  }
}
```

#### GET /api/health/performance
Get performance metrics and system statistics.

### 2. Gateway Information

#### GET /api/payments/gateways
Get information about all available payment gateways.

**Response:**
```json
{
  "success": true,
  "data": {
    "capabilities": {
      "stripe": {
        "name": "stripe",
        "supportedCurrencies": ["usd", "eur", "gbp", "jpy"],
        "supportedPaymentMethods": ["card", "bank_transfer", "sepa_debit"],
        "features": ["payment_intents", "subscriptions", "refunds"]
      },
      "paystack": {
        "name": "paystack",
        "supportedCurrencies": ["NGN", "GHS", "ZAR", "USD"],
        "supportedPaymentMethods": ["card", "bank", "ussd", "qr"],
        "features": ["transactions", "refunds", "verification"]
      }
    }
  }
}
```

#### GET /api/payments/gateways/:gateway
Get detailed information about a specific gateway.

**Parameters:**
- `gateway` (string): Gateway name (stripe, paystack)

### 3. Payment Processing

#### POST /api/payments/intent
Create a payment intent (for Stripe) or transaction initialization (for Paystack).

**Request Body:**
```json
{
  "gateway": "stripe",
  "amount": 1000,
  "currency": "usd",
  "description": "Payment for order #123",
  "metadata": {
    "orderId": "order_123",
    "customerId": "cust_456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_1234567890",
    "clientSecret": "pi_1234567890_secret_abcdef",
    "amount": 1000,
    "currency": "usd",
    "status": "requires_payment_method",
    "gateway": "stripe"
  }
}
```

#### POST /api/payments/process
Process a payment directly.

**Request Body:**
```json
{
  "gateway": "stripe",
  "amount": 1000,
  "currency": "usd",
  "paymentMethodId": "pm_1234567890",
  "description": "Payment for order #123",
  "confirm": true,
  "metadata": {
    "orderId": "order_123",
    "customerId": "cust_456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pi_1234567890",
    "status": "succeeded",
    "amount": 1000,
    "currency": "usd",
    "gateway": "stripe",
    "transactionId": "txn_1234567890",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### POST /api/payments/refund
Process a refund for a completed payment.

**Request Body:**
```json
{
  "gateway": "stripe",
  "paymentId": "pi_1234567890",
  "amount": 1000,
  "reason": "requested_by_customer",
  "metadata": {
    "refundReason": "Customer requested refund",
    "processedBy": "admin_123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "refundId": "re_1234567890",
    "paymentId": "pi_1234567890",
    "amount": 1000,
    "currency": "usd",
    "status": "succeeded",
    "gateway": "stripe",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### GET /api/payments/status/:gateway/:paymentId
Get the status of a payment.

**Parameters:**
- `gateway` (string): Gateway name
- `paymentId` (string): Payment ID from the gateway

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pi_1234567890",
    "status": "succeeded",
    "amount": 1000,
    "currency": "usd",
    "gateway": "stripe",
    "createdAt": "2024-01-15T10:25:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Webhook Handling

#### POST /api/webhooks/stripe
Handle Stripe webhook events.

**Headers Required:**
```http
stripe-signature: t=1234567890,v1=abc123...
```

**Request Body:** Stripe event object

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": "evt_1234567890",
    "type": "payment_intent.succeeded",
    "processed": true,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### POST /api/webhooks/paystack
Handle Paystack webhook events.

**Request Body:** Paystack event object

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": "evt_1234567890",
    "type": "charge.success",
    "processed": true,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### POST /api/webhooks/unified
Unified webhook endpoint that routes to the appropriate gateway handler.

**Request Body:**
```json
{
  "gateway": "stripe",
  "event": {
    "type": "payment_intent.succeeded",
    "data": { ... }
  }
}
```

## Error Handling

All API responses follow a consistent error format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": "Additional error details"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/payments/process",
  "method": "POST"
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `AUTHENTICATION_ERROR`: Invalid or missing API key
- `GATEWAY_ERROR`: Payment gateway error
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `INTERNAL_ERROR`: Server internal error

## Integration Examples

### JavaScript/Node.js

```javascript
const UnifiedPaymentsClient = require('./examples/client-sdk');

const client = new UnifiedPaymentsClient('your-api-key', 'https://api.yourdomain.com');

// Create payment intent
const paymentIntent = await client.createPaymentIntent({
  gateway: 'stripe',
  amount: 1000,
  currency: 'usd',
  description: 'Payment for order #123'
});

// Process payment
const payment = await client.processPayment({
  gateway: 'stripe',
  amount: 1000,
  currency: 'usd',
  paymentMethodId: 'pm_1234567890',
  description: 'Payment for order #123'
});
```

### cURL Examples

```bash
# Get available gateways
curl -H "x-api-key: your-api-key" \
  https://api.yourdomain.com/api/payments/gateways

# Create payment intent
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "gateway": "stripe",
    "amount": 1000,
    "currency": "usd",
    "description": "Payment for order #123"
  }' \
  https://api.yourdomain.com/api/payments/intent

# Process payment
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "gateway": "stripe",
    "amount": 1000,
    "currency": "usd",
    "paymentMethodId": "pm_1234567890",
    "description": "Payment for order #123"
  }' \
  https://api.yourdomain.com/api/payments/process
```

## Webhook Setup

### Stripe Webhooks

1. Go to your Stripe Dashboard > Webhooks
2. Add endpoint: `https://api.yourdomain.com/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy the webhook signing secret to your environment variables

### Paystack Webhooks

1. Go to your Paystack Dashboard > Settings > Webhooks
2. Add URL: `https://api.yourdomain.com/api/webhooks/paystack`
3. Select events: `charge.success`, `charge.failed`
4. Verify webhook signature in your application

## Testing

Use the provided Postman collection (`postman_collection.json`) to test all endpoints. The collection includes:

- Pre-configured requests for all endpoints
- Environment variables for easy switching between environments
- Example request bodies for payment processing
- Webhook simulation requests

## Support

For support and questions:
- Check the health endpoints for system status
- Review error logs for detailed error information
- Contact support with your API key and request details

## Changelog

### Version 1.0.0
- Initial release
- Support for Stripe and Paystack
- Unified payment processing interface
- Comprehensive webhook handling
- Health monitoring and performance metrics 