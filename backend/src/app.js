// src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const wordRoutes = require('./routes/wordRoutes');
const requestLogger = require('./middleware/requestLogger');

const app = express();

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

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'English Dictionary API is running'
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