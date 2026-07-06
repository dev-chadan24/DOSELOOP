import rateLimit from 'express-rate-limit';

/**
 * Shared HTTP 429 response body.
 * Matches the project's standard ApiResponse shape so clients can handle
 * rate-limit errors with the same deserialization path as validation errors.
 */
const rateLimitResponse = (message: string) => ({
  success: false,
  error: { message },
});

// ---------------------------------------------------------------------------
// General API — 100 requests / 15 minutes
// ---------------------------------------------------------------------------
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse('Too many requests, please try again later.'),
});

// ---------------------------------------------------------------------------
// Authentication — 10 requests / 15 minutes
// ---------------------------------------------------------------------------
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse('Too many authentication attempts, please try again later.'),
});

// ---------------------------------------------------------------------------
// Password Reset — 5 requests / 15 minutes
// ---------------------------------------------------------------------------
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse('Too many password reset attempts, please try again later.'),
});

// ---------------------------------------------------------------------------
// Email / Sensitive — 5 requests / 15 minutes
// ---------------------------------------------------------------------------
export const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse('Too many email requests, please try again later.'),
});

// ---------------------------------------------------------------------------
// Future OTP — reusable, not mounted on any route yet
// ---------------------------------------------------------------------------
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse('Too many OTP requests, please try again later.'),
});
