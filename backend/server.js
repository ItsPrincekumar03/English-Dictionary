// server.js

// Load environment variables from .env into process.env
// This must run before we try to read process.env.PORT below.
require('dotenv').config();

const app = require('./src/app');

// Read PORT from environment variables, falling back to 5000
// if it's not defined in .env. This makes the app flexible —
// e.g. a hosting platform can set its own PORT without code changes.
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ English Dictionary API is running on http://localhost:${PORT}`);
});