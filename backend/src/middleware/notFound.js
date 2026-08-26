// src/middleware/notFound.js

/**
 * Middleware: handles any request that doesn't match a defined route.
 * Must be registered AFTER all real routes in app.js, so it only
 * triggers when nothing else matched the incoming request.
 */
function notFound(req, res, next) {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
}

module.exports = notFound;