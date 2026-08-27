// server.js

require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/database');
const mongoose = require('mongoose');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;
let server;

// Connect to MongoDB first. Only start accepting HTTP requests
// once the connection succeeds.
async function startServer() {
    await connectDB();

    server = app.listen(PORT, () => {
        logger.info(`English Dictionary API is running`, { port: PORT, env: process.env.NODE_ENV || 'development' });
    });
}

startServer();

// Graceful shutdown handling
function gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    if (server) {
        server.close(async () => {
            logger.info('HTTP server closed.');
            try {
                await mongoose.connection.close();
                logger.info('MongoDB connection closed.');
                process.exit(0);
            } catch (err) {
                logger.error('Error closing MongoDB connection', { error: err.message });
                process.exit(1);
            }
        });
    } else {
        process.exit(0);
    }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions (synchronous errors outside Express)
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION - Shutting down', { error: err.message });
    // In production, Render/PM2 will automatically restart the process after it exits
    process.exit(1); 
});

// Handle unhandled promise rejections (asynchronous errors outside Express)
process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION - Shutting down', { error: err.message });
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});