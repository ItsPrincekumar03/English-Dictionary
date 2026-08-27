const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function runSmokeTest() {
    console.log(`Starting smoke tests against: ${API_BASE_URL}\n`);
    
    let hasFailure = false;

    async function testEndpoint(endpoint, expectedStatus, validationFn = null) {
        const url = `${API_BASE_URL}${endpoint}`;
        try {
            const res = await fetch(url);
            if (res.status !== expectedStatus) {
                console.error(`[FAIL] GET ${endpoint} - Expected ${expectedStatus}, got ${res.status}`);
                hasFailure = true;
                return;
            }
            
            if (validationFn) {
                const data = await res.json();
                const isValid = validationFn(data);
                if (!isValid) {
                    console.error(`[FAIL] GET ${endpoint} - JSON validation failed`);
                    hasFailure = true;
                    return;
                }
            }
            
            console.log(`[PASS] GET ${endpoint}`);
        } catch (err) {
            console.error(`[FAIL] GET ${endpoint} - Network/Fetch error: ${err.message}`);
            hasFailure = true;
        }
    }

    await testEndpoint('/health', 200, (data) => data.status === 'ok');
    await testEndpoint('/words/happy', 200, (data) => data.word === 'happy' && data.meanings && data.meanings.length > 0);
    await testEndpoint('/words/run', 200, (data) => data.word === 'run' && data.meanings.length > 0);
    await testEndpoint('/words/good', 200, (data) => data.word === 'good');
    await testEndpoint('/words/nonexistentword', 404);

    console.log("\n========================================");
    if (hasFailure) {
        console.error("SMOKE TEST STATUS: \x1b[31mFAIL\x1b[0m");
        process.exit(1);
    } else {
        console.log("SMOKE TEST STATUS: \x1b[32mPASS\x1b[0m");
    }
}

if (require.main === module) {
    runSmokeTest();
}

module.exports = { runSmokeTest };
