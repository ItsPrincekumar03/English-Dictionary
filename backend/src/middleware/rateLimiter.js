// src/middleware/rateLimiter.js

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Creates a rate limiter instance using configuration from environment variables.
 * We use an in-memory store since this is a simple single-server development setup.
 *
 * NOTE: If the app is later deployed behind a reverse proxy (like Nginx, Heroku, or AWS ELB),
 * you will need to add `app.set('trust proxy', 1)` in app.js
 * for the IP address to be read correctly.
 */
const apiLimiter = rateLimit({
    // Default to 15 minutes (900,000 ms) if not specified in .env
    windowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) : 15 * 60 * 1000, 

    // Default to 100 requests per window if not specified
    max: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) : 100, 

    // Return a clean, user-friendly JSON response that matches our standard API format
    // when the rate limit is exceeded.
    handler: (req, res, next, options) => {
        logger.warn('Rate limit exceeded', { ip: req.ip, url: req.originalUrl });
        res.status(options.statusCode).json({
            success: false,
            message: 'Too many requests. Please try again later.'
        });
    },

    // Include standard rate limit headers (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
    standardHeaders: true, 

    // Disable the legacy X-RateLimit-* headers
    legacyHeaders: false,
});

module.exports = apiLimiter;
