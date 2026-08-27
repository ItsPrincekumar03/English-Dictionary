const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;

async function check() {
    if (!uri) {
        console.log("MONGODB_URI is NOT SET.");
        process.exit(1);
    }
    console.log("MONGODB_URI exists in environment.");

    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
        console.log("MONGODB_URI has INVALID syntax (missing mongodb:// or mongodb+srv:// prefix).");
        process.exit(1);
    }
    console.log("MONGODB_URI syntax prefix verified.");

    try {
        const url = new URL(uri);
        const password = decodeURIComponent(url.password);
        // Check if the original password in the URI has characters that need encoding but weren't encoded.
        // If url.password contains raw special chars (like @, #, ?, &, =, etc.) that are not percent-encoded,
        // it can cause auth failures.
        const encodedPassword = encodeURIComponent(password);
        if (url.password !== encodedPassword && decodeURIComponent(url.password) === url.password) {
            console.log("DIAGNOSTIC: Password in URI might contain unencoded special characters. Ensure your password is URL-encoded (e.g., using encodeURIComponent).");
        } else {
            console.log("DIAGNOSTIC: Password appears properly encoded or contains no special characters.");
        }
    } catch (e) {
         console.log("DIAGNOSTIC: Could not parse URL structure. Ensure it is a valid URL format.");
    }

    try {
        console.log("Attempting to connect to MongoDB...");
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log("CONNECTION SUCCESSFUL.");
        await mongoose.disconnect();
    } catch (e) {
        console.log("CONNECTION FAILED:", e.message);
        if (e.message.includes('Authentication failed') || e.message.includes('bad auth')) {
            console.log("DIAGNOSTIC: Authentication failed. This usually means the username, password, or authSource database is incorrect, or the password contains special characters that are not URL-encoded.");
        }
    }
}
check();
