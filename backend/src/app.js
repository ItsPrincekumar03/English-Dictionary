// src/app.js

const express = require('express');
const cors = require('cors');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const wordRoutes = require('./routes/wordRoutes');

const app = express();

// Enable CORS for all origins.
// This allows your frontend (running on a different port, e.g. 127.0.0.1:5500)
// to make fetch() requests to this backend (running on localhost:5000).
// Without this, the browser blocks the response before your frontend
// JavaScript ever sees it — exactly the error you were hitting.
app.use(cors());

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'English Dictionary API is running'
    });
});

// Mount the word router at /api/words.
app.use('/api/words', wordRoutes);

// notFound must come AFTER all real routes.
app.use(notFound);

// errorHandler must be registered LAST.
app.use(errorHandler);

module.exports = app;