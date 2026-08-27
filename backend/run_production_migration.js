const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { parseWordNetJSON } = require('./scripts/migration/parser');
const { runMigration } = require('./scripts/migration/migration');
const Word = require('./src/models/Word');
const { execSync } = require('child_process');

function checkSafetyGates() {
    console.log("===============================================");
    console.log("   PRODUCTION MIGRATION PRE-FLIGHT CHECKS");
    console.log("===============================================\n");

    const errors = [];

    if (process.env.ALLOW_PRODUCTION_MIGRATION !== 'true') {
        errors.push("Missing or invalid ALLOW_PRODUCTION_MIGRATION");
    }
    if (process.env.BACKUP_VERIFIED !== 'true') {
        errors.push("Missing or invalid BACKUP_VERIFIED");
    }
    if (process.env.CONFIRM_PRODUCTION_MIGRATION !== 'YES') {
        errors.push("Missing or invalid CONFIRM_PRODUCTION_MIGRATION");
    }
    if (process.env.HUMAN_AUTHORIZATION !== 'true') {
        errors.push("Missing or invalid HUMAN_AUTHORIZATION");
    }

    if (errors.length > 0) {
        console.error("PRODUCTION MIGRATION BLOCKED: required authorization gates are missing.");
        errors.forEach(e => console.error(` - ${e}`));
        process.exit(1);
    }

    // URI Safety Validation
    const uri = process.env.MONGODB_URI || '';
    if (!uri) {
        console.error("PRODUCTION MIGRATION BLOCKED: MONGODB_URI is not set.");
        process.exit(1);
    }
    const forbiddenPhrases = ['localhost', '127.0.0.1', 'mongodb://localhost', 'test', 'staging', 'dictionary_staging', 'dev'];
    for (const phrase of forbiddenPhrases) {
        if (uri.toLowerCase().includes(phrase)) {
            console.error(`PRODUCTION MIGRATION BLOCKED: MONGODB_URI contains forbidden phrase: '${phrase}'.`);
            process.exit(1);
        }
    }
    
    let dbName = '';
    try {
        const urlParts = uri.split('?')[0].split('/');
        dbName = urlParts[urlParts.length - 1];
    } catch (e) {
        console.error("PRODUCTION MIGRATION BLOCKED: Could not parse MONGODB_URI to verify database name.");
        process.exit(1);
    }
    
    if (dbName !== 'dictionary') {
        console.error(`PRODUCTION MIGRATION BLOCKED: Target database is '${dbName}', expected 'dictionary'.`);
        process.exit(1);
    }

    // Dataset Verification
    const datasetDir = __dirname;
    const files = fs.existsSync(datasetDir) ? fs.readdirSync(datasetDir) : [];
    const synsetFiles = files.filter(f => /^(noun|verb|adj|adv)\..*\.json$/.test(f));
    const entriesFiles = files.filter(f => /^entries-.*\.json$/.test(f));
    
    if (synsetFiles.length === 0 || entriesFiles.length === 0) {
        console.error("PRODUCTION MIGRATION BLOCKED: Open English WordNet 2025 dataset files not found.");
        process.exit(1);
    }

    console.log("Running automated test suite (checking dependencies)...");
    try {
        // We run tests quietly to prevent overwhelming output in the console, but fail if they error.
        // Actually, we skip full test suite in this script to prevent huge delays in dry-run,
        // but we verify the exit code.
        execSync('npm test', { cwd: __dirname, stdio: 'ignore' });
    } catch (error) {
        console.error("\nTEST_GATE = FAILED");
        console.error("PRODUCTION MIGRATION BLOCKED: Test suite failed.");
        process.exit(1);
    }

    console.log("All safety gates passed. Connecting to production database...");
}

async function runProductionMigration() {
    checkSafetyGates();

    try {
        // We mask the URI in output
        console.log("Connecting to production database [URI MASKED]...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to production database successfully.");

        const preMigrationCount = await Word.countDocuments();
        console.log(`\nPRE_MIGRATION_DOCUMENT_COUNT: ${preMigrationCount}`);
        
        console.log("\nLoading Open English WordNet 2025 dataset...");
        const synsets = [];
        const antonymPairs = [];
        const pronunciations = [];
        
        const files = fs.readdirSync(__dirname);
        const synsetFiles = files.filter(f => /^(noun|verb|adj|adv)\..*\.json$/.test(f));
        const entriesFiles = files.filter(f => /^entries-.*\.json$/.test(f));
        
        for (const file of synsetFiles) {
            const parsed = parseWordNetJSON(fs.readFileSync(path.join(__dirname, file), 'utf8'));
            if (parsed) synsets.push(...parsed);
        }
        for (const file of entriesFiles) {
            const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
            const parsedData = parseWordNetJSON(content, true);
            if (parsedData) {
                antonymPairs.push(...parsedData.antonymPairs);
                pronunciations.push(...parsedData.pronunciations);
            }
        }
        
        console.log(`Parsed ${synsets.length} synsets and extracted lexical relations.`);
        
        // Count approximate canonical words
        const expectedRecords = Object.keys(
            synsets.reduce((acc, s) => {
                s.words.forEach(w => { acc[w.toLowerCase()] = true });
                return acc;
            }, {})
        ).length;

        console.log(`Expected canonical records: ~${expectedRecords}`);

        if (expectedRecords < 120000 || expectedRecords > 130000) {
            console.error(`PRODUCTION MIGRATION BLOCKED: Expected record count (${expectedRecords}) is outside the validated staging range (120k-130k).`);
            process.exit(1);
        }

        if (process.env.DRY_RUN === 'true') {
            console.log("\n========================================");
            console.log("DRY RUN");
            console.log("NO PRODUCTION WRITES PERFORMED");
            console.log("========================================");
            
            // Sample read
            const sample = await Word.findOne({ word: 'happy' });
            console.log(`SAMPLE_WORD_STATUS (happy): ${sample ? 'Found' : 'Not Found'}`);
            
            process.exit(0);
        }

        console.log("\n========================================");
        console.log("FINAL PRODUCTION WRITE GATE");
        console.log("========================================");
        console.log("Target database: dictionary");
        console.log("Migration: Open English WordNet 2025");
        console.log("Operation: NON-DESTRUCTIVE UPSERT");
        console.log(`Expected records: ~${expectedRecords}`);
        console.log("Destructive operations: DISABLED");
        console.log("Backup: VERIFIED");
        console.log("Human authorization: VERIFIED");
        console.log("========================================\n");

        // Double check just before write
        if (
            process.env.ALLOW_PRODUCTION_MIGRATION !== "true" ||
            process.env.BACKUP_VERIFIED !== "true" ||
            process.env.CONFIRM_PRODUCTION_MIGRATION !== "YES" ||
            process.env.HUMAN_AUTHORIZATION !== "true"
        ) {
            console.error("PRODUCTION MIGRATION BLOCKED: required authorization gates missing at final write gate.");
            process.exit(1);
        }

        const startT = Date.now();
        console.log("Starting non-destructive upsert migration...");
        const metrics = await runMigration(synsets, antonymPairs, pronunciations);
        const endT = Date.now();
        
        console.log("\nMigration completed.");
        console.log(`Duration: ${(endT - startT) / 1000}s`);
        
        if (metrics.failedBatches > 0 || metrics.errors > 0) {
            console.error("CRITICAL: Migration encountered errors or failed batches.");
            process.exit(1);
        }

        const postMigrationCount = await Word.countDocuments();
        console.log(`\nPOST_MIGRATION_DOCUMENT_COUNT: ${postMigrationCount}`);
        
        if (postMigrationCount < preMigrationCount) {
            console.error("CRITICAL:\nProduction document count decreased. This is unacceptable in a non-destructive migration.");
            process.exit(1);
        }

        console.log("\nPRODUCTION MIGRATION SUCCESSFUL (Pending final API/Frontend checks).");
        
    } catch (err) {
        console.error("Migration failed due to an unexpected error:", err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

// Only run automatically if this file is the main module
if (require.main === module) {
    runProductionMigration();
}

module.exports = { checkSafetyGates };
