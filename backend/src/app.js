// src/app.js

const express = require('express');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const wordRoutes = require('./routes/wordRoutes');

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'English Dictionary API is running'
    });
});

// Mount the word router at /api/words.
// Any request starting with /api/words is handed off to wordRoutes,
// which then matches the remaining path against its own routes
// (in this case, /:word).
app.use('/api/words', wordRoutes);

// notFound must come AFTER all real routes.
app.use(notFound);

// errorHandler must be registered LAST.
app.use(errorHandler);

module.exports = app;