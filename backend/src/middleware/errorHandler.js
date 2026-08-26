// src/middleware/errorHandler.js

const logger = require('../utils/logger');

/**
 * Centralized error-handling middleware.
 * Express recognizes this as an error handler specifically because
 * it takes FOUR parameters (err, req, res, next) — this exact
 * signature is required, even though `next` goes unused here.
 * Must be registered LAST in app.js, after all routes and other middleware.
 */
function errorHandler(err, req, res, next) {
    // Log the full error server-side, for developers only.
    // This NEVER goes to the client — it's for your terminal/logs.
    const statusCode = err.statusCode || 500;
    
    const logContext = { 
        message: err.message, 
        statusCode,
        url: req.originalUrl,
        method: req.method,
        id: req.id
    };

    if (statusCode >= 500) {
        logger.error('API Error', logContext);
    } else {
        logger.warn('Client Error', logContext);
    }
    
    if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
        logger.debug('Stack trace:', { stack: err.stack });
    }

    // Default to 500 (unexpected server error) unless the error
    // explicitly carries a more specific status code — e.g. the
    // 400 thrown by wordService for empty input (Module 7).
    
    // Decide what message to actually send the client.
    // For genuine 500s (unexpected, unplanned failures), we deliberately
    // hide the real error message from the client and send a generic one —
    // the real message could leak internal details (file paths, query
    // structure, library internals). For any error that intentionally
    // set its own statusCode (meaning a layer of our own code chose to
    // communicate something specific and safe, like "Word is required"),
    // we trust and forward that message, since it was written for this purpose.
    const clientMessage =
        statusCode === 500 ? 'Internal server error' : err.message;

    res.status(statusCode).json({
        success: false,
        message: clientMessage
    });
}

module.exports = errorHandler;