# 🚀 Unified Payments API

> **Single API for Multiple Payment Gateways** - Process payments through Stripe, Paystack, and more with one consistent interface.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)]()

## 🎯 **What This Solves**

**Before**: Developers waste time integrating multiple payment gateways with different APIs, auth methods, and response formats.

**After**: One unified API that handles all payment gateways with consistent responses, making integration 10x faster.

## ✨ **Key Features**

- 🔌 **Plug-and-Play Architecture** - Add new gateways without touching existing code
- 🛡️ **Enterprise Security** - PCI DSS compliant, webhook verification, rate limiting
- 🌍 **Global Coverage** - Support for 100+ currencies and payment methods
- 📊 **Real-time Monitoring** - Health checks, performance metrics, webhook handling
- 🚀 **Production Ready** - Built for scale with proper error handling and logging

## 🏗️ **Architecture**

```
[Client App] → [Unified Payments API] → [Gateway Adapters] → [Payment Gateways]
                                    ↓
                              [Webhook Router]
                                    ↓
                              [Event Processing]
```

## 🚀 **Quick Start**

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Environment Setup**
```bash
cp env.example .env
```

Fill in your payment gateway credentials:
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_key_here
```

### 3. **Start the Server**
```bash
# Development
npm run dev

# Production
npm start
```

Your API will be running at `http://localhost:3000`

## 📚 **API Endpoints**

### **Payments**

#### Process Payment
```http
POST /api/payments/process
Content-Type: application/json
X-API-Key: your_api_key_here

{
  "gateway": "stripe",
  "amount": 29.99,
  "currency": "USD",
  "customerEmail": "customer@example.com",
  "description": "Premium Plan Subscription",
  "metadata": {
    "orderId": "order_123",
    "plan": "premium"
  }
}
```

#### Create Payment Intent
```http
POST /api/payments/intent
Content-Type: application/json
X-API-Key: your_api_key_here

{
  "gateway": "stripe",
  "amount": 29.99,
  "currency": "USD",
  "customerEmail": "customer@example.com"
}
```

#### Process Refund
```http
POST /api/payments/refund
Content-Type: application/json
X-API-Key: your_api_key_here

{
  "gateway": "stripe",
  "paymentIntentId": "pi_1234567890",
  "amount": 29.99,
  "reason": "Customer requested refund"
}
```

#### Get Payment Status
```http
GET /api/payments/status/stripe/pi_1234567890
X-API-Key: your_api_key_here
```

### **Webhooks**

#### Stripe Webhooks
```http
POST /api/webhooks/stripe
Content-Type: application/json
Stripe-Signature: whsec_your_webhook_secret

{
  "type": "payment_intent.succeeded",
  "data": { ... }
}
```

#### Paystack Webhooks
```http
POST /api/webhooks/paystack
Content-Type: application/json
X-Paystack-Signature: your_webhook_signature

{
  "event": "charge.success",
  "data": { ... }
}
```

#### Unified Webhook (Route to any gateway)
```http
POST /api/webhooks/unified
Content-Type: application/json

{
  "gateway": "stripe",
  "type": "payment_intent.succeeded",
  "data": { ... }
}
```

### **Health & Monitoring**

#### System Health
```http
GET /api/health
```

#### Gateway Status
```http
GET /api/health/gateways
```

#### Performance Metrics
```http
GET /api/health/performance
```

#### Readiness Check
```http
GET /api/health/ready
```

## 🔌 **Supported Gateways**

### **Stripe**
- ✅ Cards, Wallets, Bank Transfers
- ✅ 135+ Currencies
- ✅ Webhooks & Refunds
- ✅ Payment Intents

### **Paystack**
- ✅ Cards, Bank Transfers, USSD
- ✅ 50+ Currencies (African focus)
- ✅ Webhooks & Refunds
- ✅ Transaction Verification

### **Coming Soon**
- 🔄 PayPal
- 🔄 Flutterwave
- 🔄 Razorpay
- 🔄 Square

## 💻 **Client Integration Examples**

### **JavaScript/Node.js**
```javascript
const processPayment = async (paymentData) => {
  const response = await fetch('https://your-api.com/api/payments/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'your_api_key_here'
    },
    body: JSON.stringify({
      gateway: 'stripe',
      amount: 29.99,
      currency: 'USD',
      customerEmail: 'customer@example.com'
    })
  });
  
  return response.json();
};
```

### **Python**
```python
import requests

def process_payment(payment_data):
    response = requests.post(
        'https://your-api.com/api/payments/process',
        headers={
            'Content-Type': 'application/json',
            'X-API-Key': 'your_api_key_here'
        },
        json={
            'gateway': 'stripe',
            'amount': 29.99,
            'currency': 'USD',
            'customerEmail': 'customer@example.com'
        }
    )
    return response.json()
```

### **PHP**
```php
function processPayment($paymentData) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://your-api.com/api/payments/process');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'gateway' => 'stripe',
        'amount' => 29.99,
        'currency' => 'USD',
        'customerEmail' => 'customer@example.com'
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-API-Key: your_api_key_here'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}
```

## 🚀 **Deployment**

### **Render**
```yaml
# render.yaml
services:
  - type: web
    name: unified-payments-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

### **Railway**
```bash
railway login
railway init
railway up
```

### **Vercel**
```bash
vercel --prod
```

### **Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔒 **Security Features**

- 🔐 **API Key Authentication**
- 🛡️ **Webhook Signature Verification**
- 🚫 **Rate Limiting** (100 req/15min, 10 payments/min)
- 🔒 **CORS Protection**
- 🧪 **Input Validation**
- 📝 **Comprehensive Logging**
- 🚨 **Error Handling**

## 📊 **Monitoring & Observability**

- **Health Checks**: `/api/health/*`
- **Performance Metrics**: Memory, CPU, Response times
- **Gateway Status**: Real-time availability monitoring
- **Request Logging**: IP, User-Agent, Timestamp
- **Error Tracking**: Structured error responses

## 🧪 **Testing**

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "payment processing"
```

## 📈 **Scaling Considerations**

### **Horizontal Scaling**
- Stateless design for easy replication
- Redis for session management
- Load balancer for traffic distribution

### **Database Scaling**
- PostgreSQL for transaction storage
- Read replicas for analytics
- Connection pooling

### **Gateway Scaling**
- Circuit breakers for gateway failures
- Retry mechanisms with exponential backoff
- Fallback to alternative gateways

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- 📧 **Email**: support@unifiedpayments.com
- 💬 **Discord**: [Join our community](https://discord.gg/unifiedpayments)
- 📚 **Documentation**: [docs.unifiedpayments.com](https://docs.unifiedpayments.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/unified-payments-api/issues)

## 🎉 **Show Your Support**

Give a ⭐️ if this project helped you!

---

**Built with ❤️ for developers who want to focus on building great products, not payment integrations.** 