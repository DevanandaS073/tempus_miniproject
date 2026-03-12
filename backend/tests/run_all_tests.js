/**
 * run_all_tests.js
 * Runs all Tempus test modules sequentially and prints a final summary.
 *
 * Usage:
 *   node tests/run_all_tests.js
 *
 * Environment variables (set in .env or inline):
 *   TEST_BASE_URL     — server URL (default: http://localhost:3000)
 *   TEST_TOKEN        — JWT for an admin workspace user
 *   TEST_WORKER_TOKEN — JWT for a non-admin workspace user (optional, for RBAC check)
 *
 * Example with inline env:
 *   TEST_TOKEN=eyJ... TEST_WORKER_TOKEN=eyJ... node tests/run_all_tests.js
 */

const { execSync } = require('child_process');
const path = require('path');

const TESTS = [
    { name: 'Authentication',         file: 'test_auth.js' },
    { name: 'Calendar & Meetings',    file: 'test_calendar.js' },
    { name: 'Event Management',       file: 'test_events.js' },
    { name: 'Notifications',          file: 'test_notifications.js' },
    { name: 'RBAC / Roles',           file: 'test_rbac.js' },
];

const results = [];

console.log('\n╔══════════════════════════════════════╗');
console.log('║      TEMPUS — Full Test Suite        ║');
console.log('╚══════════════════════════════════════╝');

for (const t of TESTS) {
    const filePath = path.join(__dirname, t.file);
    try {
        execSync(`node "${filePath}"`, {
            stdio: 'inherit',
            env: process.env,
        });
        results.push({ name: t.name, ok: true });
    } catch {
        results.push({ name: t.name, ok: false });
    }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Final Summary');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

let allPassed = true;
for (const r of results) {
    const icon = r.ok ? '✅' : '❌';
    console.log(`  ${icon}  ${r.name}`);
    if (!r.ok) allPassed = false;
}

console.log('\n' + (allPassed ? '  🎉 All test modules passed.' : '  ⚠️  Some modules had failures.') + '\n');
process.exit(allPassed ? 0 : 1);
