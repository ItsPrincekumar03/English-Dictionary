// src/utils/logger.js

/**
 * Simple, centralized logging utility.
 * Why a custom logger? For a beginner-level dictionary API, importing heavy 
 * libraries like Winston or Pino is over-engineering. A standard wrapper around 
 * console ensures consistent formatting (TIMESTAMP LEVEL MESSAGE CONTEXT) 
 * without adding unnecessary dependency weight, keeping development simple and lean.
 */

function formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    
    // Safely format context if provided. Prevent printing empty objects {}.
    let contextString = '';
    if (Object.keys(context).length > 0) {
        // Strip out any potentially sensitive fields just in case they slipped in
        const safeContext = { ...context };
        delete safeContext.password;
        delete safeContext.token;
        delete safeContext.authorization;
        delete safeContext.cookie;
        
        // Convert safe context to key=value string
        contextString = ' ' + Object.entries(safeContext)
            .map(([k, v]) => `${k}=${v}`)
            .join(' ');
    }

    return `${timestamp} ${level} ${message}${contextString}`;
}

const logger = {
    info: (message, context) => {
        console.log(formatMessage('INFO', message, context));
    },
    warn: (message, context) => {
        console.warn(formatMessage('WARN', message, context));
    },
    error: (message, context) => {
        console.error(formatMessage('ERROR', message, context));
    },
    debug: (message, context) => {
        // Only output debug logs in development environments to reduce production noise
        if (process.env.NODE_ENV !== 'production') {
            console.debug(formatMessage('DEBUG', message, context));
        }
    }
};

module.exports = logger;
