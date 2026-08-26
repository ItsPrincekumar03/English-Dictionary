// src/middleware/requestLogger.js

const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Middleware: Logs every incoming HTTP request and its processing duration.
 * Generates a unique request ID to track the lifecycle of the request.
 */
function requestLogger(req, res, next) {
    // Generate a simple request ID
    req.id = crypto.randomBytes(4).toString('hex');
    
    const start = Date.now();
    const method = req.method;
    const url = req.originalUrl || req.url;

    // We wait for the 'finish' event to know the final status code
    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;

        const logContext = {
            status,
            duration: `${duration}ms`,
            id: req.id
        };

        const message = `${method} ${url}`;

        // Choose appropriate log level based on response status
        if (status >= 500) {
            logger.error(message, logContext);
        } else if (status >= 400 && status < 500) {
            // 404s, 400 validation failures, and 429 rate limits are expected client behaviors.
            // Logging them as warnings prevents error logs from becoming noisy.
            logger.warn(message, logContext);
        } else {
            logger.info(message, logContext);
        }
    });

    next();
}

module.exports = requestLogger;
