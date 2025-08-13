module.exports = {
  // Server Configuration
  port: process.env.PORT || 3001,
  nodeEnv: "production",

  // Security
  cors: {
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : ["https://yourdomain.com"],
    credentials: true,
    maxAge: 86400, // 24 hours
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: "Too many requests from this IP, please try again later.",
      retryAfter: "15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // Payment Rate Limiting
  paymentRateLimit: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 payment requests per minute
    message: {
      error: "Too many payment requests, please try again later.",
      retryAfter: "1 minute",
    },
  },

  // Helmet Security
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        objectSrc: ["'none'"],
        scriptSrcAttr: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    format: "json",
    transports: ["console", "file"],
    file: {
      filename: "logs/app.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    },
  },

  // Compression
  compression: {
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  },

  // Request Size Limits
  bodyParser: {
    json: { limit: "10mb" },
    urlencoded: { extended: true, limit: "10mb" },
  },

  // Timeouts
  timeouts: {
    server: 30000, // 30 seconds
    request: 25000, // 25 seconds
    response: 25000, // 25 seconds
  },

  // Health Check
  healthCheck: {
    interval: 30000, // 30 seconds
    timeout: 5000, // 5 seconds
    retries: 3,
    startPeriod: 40000, // 40 seconds
  },

  // Payment Gateway Configuration
  gateways: {
    stripe: {
      enabled: !!process.env.STRIPE_SECRET_KEY,
      timeout: 10000, // 10 seconds
      retries: 3,
    },
    paystack: {
      enabled: !!process.env.PAYSTACK_SECRET_KEY,
      timeout: 10000, // 10 seconds
      retries: 3,
    },
  },

  // Webhook Configuration
  webhooks: {
    timeout: 5000, // 5 seconds
    maxRetries: 3,
    retryDelay: 1000, // 1 second
  },

  // Monitoring
  monitoring: {
    enabled: true,
    metrics: {
      enabled: true,
      port: process.env.METRICS_PORT || 9090,
    },
    tracing: {
      enabled: process.env.ENABLE_TRACING === "true",
      sampleRate: 0.1,
    },
  },
};
