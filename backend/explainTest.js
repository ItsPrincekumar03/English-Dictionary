const mongoose = require('mongoose');
const Word = require('./src/models/Word');
require('dotenv').config();

async function runExplain() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected.");
    const explanation = await Word.find({ word: 'happy' }).explain('executionStats');
    console.log("Execution Stats:");
    console.log(JSON.stringify(explanation[0].executionStats, null, 2));
    await mongoose.connection.close();
}
runExplain();
