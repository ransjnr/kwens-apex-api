/**
 * Error Handling Middleware
 */

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  });

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = { message, statusCode: 401 };
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = { message, statusCode: 401 };
  }

  // Stripe errors
  if (err.type === "StripeCardError") {
    const message = err.message;
    error = { message, statusCode: 400, code: "CARD_ERROR" };
  }

  if (err.type === "StripeInvalidRequestError") {
    const message = err.message;
    error = { message, statusCode: 400, code: "INVALID_REQUEST" };
  }

  if (err.type === "StripeAPIError") {
    const message = "Payment service error";
    error = { message, statusCode: 500, code: "PAYMENT_SERVICE_ERROR" };
  }

  // Paystack errors
  if (err.message && err.message.includes("Paystack")) {
    const message = err.message;
    error = { message, statusCode: 400, code: "PAYSTACK_ERROR" };
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: error.code || "INTERNAL_ERROR",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
  });
};

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom error class
 */
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error handler
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400, "VALIDATION_ERROR");
};

/**
 * Cast error handler
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, "CAST_ERROR");
};

/**
 * Duplicate key error handler
 */
const handleDuplicateKeyError = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400, "DUPLICATE_KEY");
};

/**
 * JWT error handler
 */
const handleJWTError = () => {
  return new AppError("Invalid token. Please log in again!", 401, "JWT_ERROR");
};

/**
 * JWT expired error handler
 */
const handleJWTExpiredError = () => {
  return new AppError(
    "Your token has expired! Please log in again.",
    401,
    "JWT_EXPIRED"
  );
};

module.exports = {
  errorHandler,
  asyncHandler,
  AppError,
  handleValidationError,
  handleCastError,
  handleDuplicateKeyError,
  handleJWTError,
  handleJWTExpiredError,
};
