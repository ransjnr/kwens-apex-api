# 🚀 Deployment Guide

> Complete guide to deploy your Unified Payments API to production

## 📋 **Prerequisites**

- Node.js 18+ installed
- Git repository set up
- Payment gateway accounts (Stripe, Paystack)
- Domain name (optional but recommended)

## 🌐 **Platform Options**

### **1. Render (Recommended for MVP)**

**Pros**: Free tier, easy setup, automatic deployments
**Cons**: Limited resources on free tier

#### Setup Steps:

1. **Create Render Account**
   ```bash
   # Visit https://render.com and sign up
   ```

2. **Connect Repository**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure Service**
   ```yaml
   Name: unified-payments-api
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Environment Variables**
   ```env
   NODE_ENV=production
   PORT=10000
   STRIPE_SECRET_KEY=sk_live_your_key
   STRIPE_PUBLISHABLE_KEY=pk_live_your_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   PAYSTACK_SECRET_KEY=sk_live_your_key
   PAYSTACK_PUBLIC_KEY=pk_live_your_key
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete
   - Your API will be available at `https://your-app.onrender.com`

### **2. Railway**

**Pros**: Fast deployments, good free tier, easy scaling
**Cons**: Less documentation than competitors

#### Setup Steps:

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login & Initialize**
   ```bash
   railway login
   railway init
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set STRIPE_SECRET_KEY=sk_live_your_key
   railway variables set PAYSTACK_SECRET_KEY=sk_live_your_key
   # ... set all other variables
   ```

4. **Deploy**
   ```bash
   railway up
   ```

### **3. Vercel (Serverless)**

**Pros**: Excellent performance, automatic scaling, great developer experience
**Cons**: Cold starts, function timeout limits

#### Setup Steps:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Create vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "src/server.js"
       }
     ]
   }
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### **4. DigitalOcean App Platform**

**Pros**: Predictable pricing, good performance, managed database
**Cons**: More expensive than alternatives

#### Setup Steps:

1. **Create App**
   - Go to DigitalOcean App Platform
   - Click "Create App" → "Create App from Source Code"

2. **Configure Build**
   ```yaml
   Build Command: npm install
   Run Command: npm start
   ```

3. **Set Environment Variables**
   - Add all required environment variables
   - Set `PORT=8080`

4. **Deploy**
   - Click "Create Resources"
   - Wait for deployment

### **5. AWS (Production Scale)**

**Pros**: Unlimited scalability, enterprise features, cost-effective at scale
**Cons**: Complex setup, requires DevOps knowledge

#### Setup Steps:

1. **Create ECS Cluster**
   ```bash
   aws ecs create-cluster --cluster-name unified-payments
   ```

2. **Create Task Definition**
   ```json
   {
     "family": "unified-payments",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512",
     "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "unified-payments",
         "image": "your-ecr-repo:latest",
         "portMappings": [
           {
             "containerPort": 3000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "NODE_ENV",
             "value": "production"
           }
         ]
       }
     ]
   }
   ```

3. **Deploy to ECS**
   ```bash
   aws ecs create-service \
     --cluster unified-payments \
     --service-name unified-payments-service \
     --task-definition unified-payments:1 \
     --desired-count 2
   ```

## 🐳 **Docker Deployment**

### **Local Docker Build**
```bash
# Build image
docker build -t unified-payments-api .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e STRIPE_SECRET_KEY=sk_live_your_key \
  -e PAYSTACK_SECRET_KEY=sk_live_your_key \
  unified-payments-api
```

### **Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - PAYSTACK_SECRET_KEY=${PAYSTACK_SECRET_KEY}
    restart: unless-stopped
```

## 🔒 **Production Security Checklist**

### **Environment Variables**
- [ ] All API keys are production keys (not test keys)
- [ ] Webhook secrets are properly configured
- [ ] Database connection strings are secure
- [ ] JWT secrets are strong and unique

### **SSL/TLS**
- [ ] HTTPS is enabled
- [ ] SSL certificates are valid
- [ ] HTTP to HTTPS redirect is configured

### **API Security**
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] API key validation is working
- [ ] Input validation is active

### **Monitoring**
- [ ] Health checks are configured
- [ ] Logging is enabled
- [ ] Error tracking is set up
- [ ] Performance monitoring is active

## 📊 **Performance Optimization**

### **Database Optimization**
```sql
-- Create indexes for common queries
CREATE INDEX idx_payments_gateway ON payments(gateway);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
```

### **Caching Strategy**
```javascript
// Redis caching for payment status
const cachePaymentStatus = async (paymentId, status) => {
  await redis.setex(`payment:${paymentId}`, 300, JSON.stringify(status));
};

const getCachedPaymentStatus = async (paymentId) => {
  const cached = await redis.get(`payment:${paymentId}`);
  return cached ? JSON.parse(cached) : null;
};
```

### **Load Balancing**
```nginx
# nginx.conf
upstream api_servers {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://api_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔍 **Monitoring & Alerting**

### **Health Check Endpoints**
```bash
# Basic health
curl https://your-api.com/api/health

# Detailed health
curl https://your-api.com/api/health/gateways

# Performance metrics
curl https://your-api.com/api/health/performance
```

### **Uptime Monitoring**
- **UptimeRobot**: Free uptime monitoring
- **Pingdom**: Advanced monitoring with alerts
- **StatusCake**: Comprehensive monitoring solution

### **Application Performance Monitoring**
- **New Relic**: Full-stack monitoring
- **DataDog**: Infrastructure and application monitoring
- **Sentry**: Error tracking and performance monitoring

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Port Already in Use**
```bash
# Check what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### **Environment Variables Not Loading**
```bash
# Check if .env file exists
ls -la .env

# Verify environment variables
echo $STRIPE_SECRET_KEY
```

#### **Payment Gateway Errors**
```bash
# Check gateway configuration
curl -H "X-API-Key: your_key" \
  https://your-api.com/api/health/gateways

# Test specific gateway
curl -H "X-API-Key: your_key" \
  https://your-api.com/api/payments/gateways/stripe
```

### **Logs & Debugging**
```bash
# View application logs
docker logs <container_id>

# View system logs
journalctl -u your-service -f

# Check application status
pm2 status
pm2 logs
```

## 📈 **Scaling Considerations**

### **Horizontal Scaling**
- Use load balancer (nginx, HAProxy)
- Implement session sharing (Redis)
- Use stateless design patterns

### **Database Scaling**
- Implement read replicas
- Use connection pooling
- Consider database sharding for large scale

### **Gateway Scaling**
- Implement circuit breakers
- Add retry mechanisms
- Use fallback gateways

## 🎯 **Next Steps After Deployment**

1. **Test All Endpoints**
   - Use the Postman collection
   - Verify webhook endpoints
   - Test payment processing

2. **Set Up Monitoring**
   - Configure health checks
   - Set up alerting
   - Monitor performance metrics

3. **Security Audit**
   - Penetration testing
   - Security headers verification
   - API key management

4. **Documentation**
   - Update API documentation
   - Create client SDKs
   - Write integration guides

## 📞 **Support**

- **Documentation**: [README.md](README.md)
- **Issues**: GitHub Issues
- **Community**: Discord server
- **Email**: support@unifiedpayments.com

---

**Happy Deploying! 🚀** 