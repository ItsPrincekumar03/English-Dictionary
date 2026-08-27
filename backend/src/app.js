// src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const wordRoutes = require('./routes/wordRoutes');
const requestLogger = require('./middleware/requestLogger');

const app = express();

// Trust the first proxy (e.g. Render/Heroku load balancers) so req.ip is the real client IP.
// This is critical for the rateLimiter to function per-user rather than blocking everyone globally.
app.set('trust proxy', 1);

// Log every incoming request at the very beginning of the pipeline
app.use(requestLogger);

// Secure Express apps by setting various HTTP headers
app.use(helmet());

// Hide Express fingerprint (helmet does this, but good to be explicit)
app.disable('x-powered-by');

// Parse allowed origins from environment variables, fallback to local dev
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:5500', 'http://127.0.0.1:5500'];

// Configure strict CORS
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        // OR allow if the origin is in our allowed list
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'OPTIONS'], // Dictionary only needs GET
    allowedHeaders: ['Content-Type'], // Basic headers only
    credentials: false // No auth/cookies currently used
};

app.use(cors(corsOptions));

// Parse incoming JSON request bodies (limited to 10kb to prevent payload DoS)
app.use(express.json({ limit: '10kb' }));

const mongoose = require('mongoose');

app.get('/api/health', (req, res) => {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const dbState = mongoose.connection.readyState;
    const isDbConnected = dbState === 1;

    // We return 200 even if DB is down so the monitor can still hit the endpoint, 
    // but the payload clearly indicates the DB is disconnected.
    // If you prefer the monitor to see the app as DOWN entirely when DB is down,
    // you could change the status to 503 Service Unavailable here.
    const statusCode = isDbConnected ? 200 : 503;

    res.status(statusCode).json({
        success: isDbConnected,
        message: 'English Dictionary API health check',
        database: isDbConnected ? 'connected' : 'disconnected'
    });
});

const rateLimiter = require('./middleware/rateLimiter');

// Mount the word router at /api/words.
// We apply the rate limiter here so it strictly protects our database endpoints.
app.use('/api/words', rateLimiter, wordRoutes);

// notFound must come AFTER all real routes.
app.use(notFound);

// errorHandler must be registered LAST.
app.use(errorHandler);

module.exports = app;