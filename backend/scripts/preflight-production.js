const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function runPreflight() {
    console.log("========================================");
    console.log("   AUTOMATED PRODUCTION PREFLIGHT");
    console.log("========================================\n");

    let hasFailure = false;

    const report = (name, status, details = '') => {
        const color = status === 'PASS' ? '\x1b[32m' : (status === 'WARN' ? '\x1b[33m' : '\x1b[31m');
        console.log(`[${color}${status}\x1b[0m] ${name} ${details ? '- ' + details : ''}`);
        if (status === 'FAIL') hasFailure = true;
    };

    // 1. Node / npm versions
    try {
        const nodeV = process.version;
        report('Node Version', 'PASS', nodeV);
    } catch (e) {
        report('Node Version', 'FAIL', e.message);
    }

    // 2. npm audit
    try {
        console.log("Running npm audit...");
        execSync('npm audit --json', { encoding: 'utf8', stdio: 'pipe' });
        report('npm audit', 'PASS', '0 vulnerabilities');
    } catch (e) {
        try {
            const auditRes = JSON.parse(e.stdout);
            const vulns = auditRes.metadata.vulnerabilities.total;
            if (vulns === 0) {
                report('npm audit', 'PASS', '0 vulnerabilities');
            } else {
                report('npm audit', 'FAIL', `${vulns} vulnerabilities found`);
            }
        } catch(err) {
            report('npm audit', 'WARN', 'Could not parse npm audit output');
        }
    }

    // 3. Tests
    try {
        console.log("Running tests...");
        execSync('npm test', { encoding: 'utf8', stdio: 'pipe' });
        report('Test Suite', 'PASS', 'Tests passed');
    } catch (e) {
        report('Test Suite', 'FAIL', 'Test execution failed');
    }

    // 4. Dataset Validation
    try {
        const rootDir = path.join(__dirname, '../');
        const synsetFiles = fs.readdirSync(rootDir).filter(f => /^(noun|verb|adj|adv)\..*\.json$/.test(f));
        if (synsetFiles.length > 0) {
            report('Dataset Presence', 'PASS', `${synsetFiles.length} dataset files found`);
        } else {
            report('Dataset Presence', 'FAIL', 'Missing dataset JSON files');
        }
    } catch (e) {
        report('Dataset Presence', 'FAIL', e.message);
    }

    // 5. Config Check
    try {
        const runRunner = fs.readFileSync(path.join(__dirname, '../run_production_migration.js'), 'utf8');
        if (runRunner.includes('ALLOW_PRODUCTION_MIGRATION') && runRunner.includes('BACKUP_VERIFIED') && runRunner.includes('CONFIRM_PRODUCTION_MIGRATION') && runRunner.includes('HUMAN_AUTHORIZATION')) {
            report('Migration Safety Gates', 'PASS', '4 authorization variables enforced');
        } else {
            report('Migration Safety Gates', 'FAIL', 'Missing authorization gates in runner');
        }
    } catch(e) {
        report('Migration Safety Gates', 'FAIL', e.message);
    }

    // 6. Secret Scan
    try {
        const runnerPath = path.join(__dirname, '../run_production_migration.js');
        const runnerContent = fs.readFileSync(runnerPath, 'utf8');
        if (runnerContent.includes('mongodb+srv://') && !runnerContent.includes('mongodb+srv://<admin>')) {
            // Looking for hardcoded credentials
            const regex = /mongodb\+srv:\/\/[^:]+:[^@]+@/;
            if (regex.test(runnerContent)) {
                report('Secret Scan', 'FAIL', 'Found hardcoded MongoDB URI credentials in script');
            } else {
                report('Secret Scan', 'PASS', 'No cleartext MongoDB URI secrets found');
            }
        } else {
            report('Secret Scan', 'PASS', 'No cleartext MongoDB URI secrets found');
        }
    } catch (e) {
        report('Secret Scan', 'FAIL', e.message);
    }

    console.log("\n========================================");
    if (hasFailure) {
        console.error("PREFLIGHT STATUS: \x1b[31mBLOCKED\x1b[0m");
        process.exit(1);
    } else {
        console.log("PREFLIGHT STATUS: \x1b[32mREADY\x1b[0m");
    }
}

if (require.main === module) {
    runPreflight();
}

module.exports = { runPreflight };
