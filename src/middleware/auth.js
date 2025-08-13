/**
 * Authentication Middleware
 */

/**
 * Validate API key from request headers
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"] || req.headers["authorization"];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: "API key is required",
      message:
        "Please provide an API key in the x-api-key header or Authorization header",
    });
  }

  // For demo purposes, accept any API key
  // In production, you would validate against a database
  if (process.env.NODE_ENV === "production") {
    // Check if API key is valid (implement your validation logic here)
    const isValidKey = validateApiKeyAgainstDatabase(apiKey);

    if (!isValidKey) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key",
        message: "The provided API key is not valid",
      });
    }
  }

  // Add API key to request for logging purposes
  req.apiKey = apiKey;
  next();
};

/**
 * Validate API key against database (placeholder for production)
 */
const validateApiKeyAgainstDatabase = (apiKey) => {
  // TODO: Implement actual API key validation
  // This could involve:
  // 1. Checking against a database of valid API keys
  // 2. Validating JWT tokens
  // 3. Checking API key permissions and rate limits

  // For now, accept any non-empty key
  return apiKey && apiKey.length > 0;
};

/**
 * Optional API key validation (for endpoints that can work with or without auth)
 */
const optionalApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"] || req.headers["authorization"];

  if (apiKey) {
    req.apiKey = apiKey;
    req.isAuthenticated = true;
  } else {
    req.isAuthenticated = false;
  }

  next();
};

/**
 * Rate limiting based on API key
 */
const rateLimitByApiKey = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const apiKey = req.apiKey || req.ip;
    const now = Date.now();

    if (!requests.has(apiKey)) {
      requests.set(apiKey, { count: 1, resetTime: now + windowMs });
    } else {
      const userRequests = requests.get(apiKey);

      if (now > userRequests.resetTime) {
        userRequests.count = 1;
        userRequests.resetTime = now + windowMs;
      } else {
        userRequests.count++;
      }

      if (userRequests.count > maxRequests) {
        return res.status(429).json({
          success: false,
          error: "Rate limit exceeded",
          message: `Too many requests. Limit: ${maxRequests} requests per ${
            windowMs / 1000 / 60
          } minutes`,
          retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
        });
      }
    }

    next();
  };
};

module.exports = {
  validateApiKey,
  optionalApiKey,
  rateLimitByApiKey,
};
