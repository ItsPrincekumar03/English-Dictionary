// src/config/database.js

const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connects to MongoDB using the URI defined in environment variables.
 * This function is async because mongoose.connect() returns a Promise —
 * the connection attempt happens over the network and takes time.
 */
async function connectDB() {
    const mongoURI = process.env.MONGODB_URI;

    // Validate the URI exists before even attempting to connect.
    // Failing fast here with a clear message is much easier to debug
    // than letting mongoose.connect() fail with a cryptic error later.
    if (!mongoURI) {
        logger.error('MONGODB_URI is not defined in environment variables.');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoURI);

        // Deliberately NOT logging mongoURI itself — it may contain
        // a username/password. Only confirm success generically.
        logger.info('MongoDB connected successfully');
    } catch (error) {
        // Log only the error message, not the full error object,
        // to avoid accidentally leaking connection details that
        // some drivers include in error messages/stack traces.
        logger.error('MongoDB connection failed', { error: error.message });
        process.exit(1);
    }
}

module.exports = connectDB;