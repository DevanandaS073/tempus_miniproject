/**
 * run_all_tests_with_login.js
 * Logs in test users to auto-populate TEST_TOKEN / TEST_WORKER_TOKEN,
 * then executes the full test suite.
 *
 * Usage:
 *   node tests/run_all_tests_with_login.js
 *
 * Required for admin token auto-login:
 *   TEST_LOGIN_EMAIL / TEST_LOGIN_PASSWORD
 *
 * Optional for worker token auto-login:
 *   TEST_WORKER_LOGIN_EMAIL / TEST_WORKER_LOGIN_PASSWORD
 */

require('dotenv').config();

const { spawnSync } = require('child_process');
const path = require('path');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

function resolveAdminCredentials() {
    const email = process.env.TEST_LOGIN_EMAIL || process.env.TEST_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
    const password = process.env.TEST_LOGIN_PASSWORD || process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
    return { email, password };
}

function resolveWorkerCredentials() {
    const email = process.env.TEST_WORKER_LOGIN_EMAIL || process.env.TEST_WORKER_EMAIL;
    const password = process.env.TEST_WORKER_LOGIN_PASSWORD || process.env.TEST_WORKER_PASSWORD;
    return { email, password };
}

async function login(email, password, label) {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    let payload = null;
    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (!response.ok || !payload?.token) {
        const details = payload?.error || payload?.message || `HTTP ${response.status}`;
        throw new Error(`${label} login failed: ${details}`);
    }

    return payload.token;
}

async function run() {
    const env = { ...process.env };

    if (!env.TEST_TOKEN) {
        const { email, password } = resolveAdminCredentials();
        if (!email || !password) {
            console.error('\n❌ Cannot auto-login admin test user.');
            console.error('Set TEST_LOGIN_EMAIL and TEST_LOGIN_PASSWORD in .env or shell, then re-run.\n');
            process.exit(1);
        }

        console.log('🔐 Fetching TEST_TOKEN via /api/auth/login...');
        env.TEST_TOKEN = await login(email, password, 'Admin');
        console.log('✅ TEST_TOKEN acquired.');
    } else {
        console.log('ℹ️  Using existing TEST_TOKEN from environment.');
    }

    if (!env.TEST_WORKER_TOKEN) {
        const { email, password } = resolveWorkerCredentials();
        if (email && password) {
            console.log('🔐 Fetching TEST_WORKER_TOKEN via /api/auth/login...');
            try {
                env.TEST_WORKER_TOKEN = await login(email, password, 'Worker');
                console.log('✅ TEST_WORKER_TOKEN acquired.');
            } catch (error) {
                console.log(`⚠️  ${error.message}`);
                console.log('⚠️  Continuing without TEST_WORKER_TOKEN (RBAC worker-specific checks may be skipped).');
            }
        } else {
            console.log('ℹ️  Worker login credentials not set; continuing without TEST_WORKER_TOKEN.');
        }
    } else {
        console.log('ℹ️  Using existing TEST_WORKER_TOKEN from environment.');
    }

    const runnerPath = path.join(__dirname, 'run_all_tests.js');
    const child = spawnSync('node', [runnerPath], {
        stdio: 'inherit',
        env,
    });

    process.exit(child.status ?? 1);
}

run().catch((error) => {
    console.error(`\n❌ ${error.message}\n`);
    process.exit(1);
});
