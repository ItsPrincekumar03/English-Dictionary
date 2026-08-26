// src/app.js

const express = require('express');

// Create the Express application instance.
// This object represents your entire web server's behavior —
// middleware, routes, everything gets attached to it.
const app = express();

// Built-in middleware: parses incoming requests with JSON bodies
// and makes the result available as req.body.
// We don't have any POST/PUT routes yet, but this is standard
// to set up from the very beginning — every Express API needs it
// sooner or later, and it's harmless to have on now.
app.use(express.json());

// Health-check endpoint.
// Purpose: a simple way to verify the server is up and responding,
// without touching any real logic (routes, controllers, services, data).
// This is a common convention in real backend projects — deployment
// tools and monitoring services often ping a /health endpoint
// to check if the server is alive.
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'English Dictionary API is running'
    });
});

// Export the configured app so server.js can import it and
// actually start listening on a port.
module.exports = app;