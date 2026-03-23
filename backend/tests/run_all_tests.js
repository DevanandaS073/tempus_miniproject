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

const { spawnSync } = require('child_process');
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
    const run = spawnSync('node', [filePath], {
        stdio: 'inherit',
        env: process.env,
    });

    if (run.status === 0) {
        results.push({ name: t.name, status: 'passed' });
    } else if (run.status === 2) {
        results.push({ name: t.name, status: 'skipped' });
    } else {
        results.push({ name: t.name, status: 'failed' });
    }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Final Summary');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

let hasFailures = false;
let hasSkipped = false;
for (const r of results) {
    const icon = r.status === 'passed' ? '✅' : r.status === 'skipped' ? '⏭️' : '❌';
    console.log(`  ${icon}  ${r.name}`);
    if (r.status === 'failed') hasFailures = true;
    if (r.status === 'skipped') hasSkipped = true;
}

if (hasFailures) {
    console.log('\n  ⚠️  Some modules had failures.\n');
    process.exit(1);
}

if (hasSkipped) {
    console.log('\n  ℹ️  No failures, but one or more modules were skipped (missing test tokens).\n');
    process.exit(0);
}

console.log('\n  🎉 All test modules passed.\n');
process.exit(0);
