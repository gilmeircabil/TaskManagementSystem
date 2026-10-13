import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env, isProduction } from '../config/env.js';
import { HttpError } from './errors.js';

/**
 * Helmet Security Headers (C-02)
 * Sets CSP, HSTS, noSniff, frame-ancestors to 'none', and hides server information.
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", env.CLIENT_ORIGIN],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  frameguard: { action: 'deny' },
});

/**
 * Global API Rate Limiter (C-01)
 * Limits requests to 200 per 15 minutes per IP in production.
 * In development/test, skipped to avoid friction with HMR / fast reloads / automated tests.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 200 : 5000,
  skip: () => !isProduction,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

/**
 * Sensitive Auth Rate Limiter (C-01)
 * Restricts credential brute-force attempts to 15 per 15 minutes per IP in production.
 * In development/test, skipped to prevent locking developers out during rapid iterations.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 15 : 1000,
  skip: () => !isProduction,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
});

/**
 * Request Timeout Middleware (M-01)
 * Terminates requests that hang longer than 15 seconds.
 */
export const requestTimeout: RequestHandler = (req, res, next) => {
  const timeoutMs = 15000;
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      next(new HttpError(504, 'Request timed out'));
    }
  }, timeoutMs);

  res.on('finish', () => clearTimeout(timer));
  res.on('close', () => clearTimeout(timer));
  next();
};

/**
 * CSRF / Origin Verification Middleware (H-05)
 * Verifies that mutating requests (POST, PATCH, DELETE) come from the trusted CLIENT_ORIGIN.
 */
export const verifyOrigin: RequestHandler = (req, _res, next) => {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  const origin = req.get('origin');
  const referer = req.get('referer');

  // Allow server-to-server or test requests without origin in non-production,
  // but strictly enforce in production or whenever origin/referer is present.
  if (origin) {
    if (origin !== env.CLIENT_ORIGIN) {
      return next(new HttpError(403, 'Cross-origin request blocked by CSRF policy'));
    }
    return next();
  }

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin !== env.CLIENT_ORIGIN) {
        return next(new HttpError(403, 'Cross-origin request blocked by CSRF policy'));
      }
      return next();
    } catch {
      return next(new HttpError(403, 'Invalid Referer header'));
    }
  }

  if (isProduction) {
    return next(new HttpError(403, 'Missing Origin or Referer header on mutating request'));
  }

  next();
};
