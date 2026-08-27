require('dotenv').config();
const mongoose = require('mongoose');

async function testDatabaseConnection() {
    console.log('[Test] Starting database connection test...');
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
        console.error('[Error] MONGODB_URI is not defined in the environment.');
        process.exit(1);
    }

    try {
        console.log('[Test] Attempting to connect (Timeout: 5s)...');
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 1
        });

        console.log('[Success] Connected to MongoDB!');

        const adminDb = mongoose.connection.db.admin();
        const serverStatus = await adminDb.ping();
        
        if (serverStatus && serverStatus.ok === 1) {
            console.log('[Success] Database responded to ping successfully.');
        } else {
            console.warn('[Warning] Ping failed, but connection was established.');
        }

        console.log('[Test] Closing connection...');
        await mongoose.connection.close();
        console.log('[Test] Connection closed smoothly.');
        process.exit(0);

    } catch (error) {
        console.error('[Error] Failed to connect to the database.');
        console.error('[Error Details]', error.message);
        process.exit(1);
    }
}

testDatabaseConnection();
