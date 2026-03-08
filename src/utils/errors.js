// =====================
// Custom Error Classes
// =====================
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

class AuthError extends AppError {
  constructor(message) {
    super(message, 401);
    this.name = "AuthError";
  }
}

class ForbiddenError extends AppError {
  constructor(message) {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

// =====================
// Centralized Error Handler Middleware
// =====================
function errorHandler(err, req, res, next) {
  // Log error in terminal
  console.error(`[${new Date().toISOString()}] ${err.name || "Error"}: ${err.message}`);
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // Operational errors — safe to send to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "This email is already registered.",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token. Please log in again.",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Your session has expired. Please log in again.",
    });
  }

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File is too large. Maximum size is 10MB.",
    });
  }

  // Unknown errors — don't leak details in production
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong. Please try again.",
  });
}

module.exports = {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  errorHandler,
};
