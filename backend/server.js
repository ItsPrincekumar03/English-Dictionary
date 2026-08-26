// server.js

require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB first. Only start accepting HTTP requests
// once the connection succeeds.
async function startServer() {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`✅ English Dictionary API is running on http://localhost:${PORT}`);
    });
}

startServer();