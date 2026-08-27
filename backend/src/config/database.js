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
        // Enforce a serverSelectionTimeoutMS so the app doesn't hang forever
        // if the database is down or unreachable. Also specify a connection pool size.
        const options = {
            serverSelectionTimeoutMS: 5000, // Fail after 5s instead of default 30s
            maxPoolSize: 50 // Maintain up to 50 socket connections
        };

        await mongoose.connect(mongoURI, options);

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