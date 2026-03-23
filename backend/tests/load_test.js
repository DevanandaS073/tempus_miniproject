require('dotenv').config();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.TEST_LOGIN_EMAIL || process.env.TEST_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.TEST_LOGIN_PASSWORD || process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

const MAX_AVG_MS = Number(process.env.LOAD_TEST_MAX_AVG_MS || 2000);
const MIN_SUCCESS_RATE = Number(process.env.LOAD_TEST_MIN_SUCCESS_RATE || 0.95);
const REQUEST_TIMEOUT_MS = Number(process.env.LOAD_TEST_REQUEST_TIMEOUT_MS || 15000);

const SCENARIOS = [
    { name: 'POST /api/auth/login', users: 50 },
    { name: 'GET /api/meetings', users: 100, actualPath: 'GET /api/calendar/meetings' },
    { name: 'POST /api/meetings', users: 50, actualPath: 'POST /api/calendar/meetings?force=true' },
    { name: 'GET /api/events', users: 100 },
    { name: 'POST /api/events/:id/join', users: 50 },
    { name: 'GET /api/notifications', users: 100 }
];

async function safeJson(response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

function nowMs() {
    return Number(process.hrtime.bigint() / 1000000n);
}

async function timedFetch(url, options) {
    const started = nowMs();
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            ...options,
            signal: abortController.signal
        });
        const durationMs = nowMs() - started;
        clearTimeout(timeoutId);
        return { ok: response.ok, status: response.status, durationMs };
    } catch (error) {
        const durationMs = nowMs() - started;
        clearTimeout(timeoutId);
        return { ok: false, status: 0, durationMs, error: error.message };
    }
}

function summarize(label, runs, expectedUsers) {
    const total = runs.length;
    const successCount = runs.filter(r => r.ok).length;
    const avgMs = total ? (runs.reduce((sum, r) => sum + r.durationMs, 0) / total) : 0;
    const successRate = total ? successCount / total : 0;
    const pass = successRate >= MIN_SUCCESS_RATE && avgMs <= MAX_AVG_MS && total === expectedUsers;

    return {
        label,
        users: expectedUsers,
        avgMs,
        successRate,
        pass,
        failures: total - successCount
    };
}

function printSummaryRow(result) {
    const avgText = `${result.avgMs.toFixed(2)} ms`;
    const rateText = `${(result.successRate * 100).toFixed(1)}%`;
    const status = result.pass ? 'PASS' : 'FAIL';
    console.log(`${status.padEnd(4)} | ${String(result.users).padStart(3)} users | avg ${avgText.padStart(10)} | success ${rateText.padStart(7)} | ${result.label}`);
}

async function loginOnce() {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        throw new Error('Missing admin credentials. Set TEST_LOGIN_EMAIL and TEST_LOGIN_PASSWORD.');
    }

    const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    const payload = await safeJson(response);
    if (!response.ok || !payload?.token) {
        throw new Error(`Admin login failed: ${payload?.error || `HTTP ${response.status}`}`);
    }

    return payload.token;
}

async function runConcurrent(users, requestFactory) {
    const runs = await Promise.all(
        Array.from({ length: users }, (_, i) => requestFactory(i))
    );
    return runs;
}

async function createJoinTargetEvents(token, count) {
    const startBase = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const createdIds = [];

    for (let i = 0; i < count; i++) {
        const start = new Date(startBase + i * 2 * 60 * 60 * 1000);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        const response = await fetch(`${BASE_URL}/api/events?force=true`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: `Load Join Event ${Date.now()}-${i}`,
                description: 'Load test event for join endpoint',
                event_type: 'load-test',
                start_date: start.toISOString(),
                end_date: end.toISOString(),
                location: 'Load Test'
            })
        });

        const payload = await safeJson(response);
        if (!response.ok || !payload?.event_id) {
            throw new Error(`Failed preparing join events at index ${i}: ${payload?.error || `HTTP ${response.status}`}`);
        }

        createdIds.push(payload.event_id);
    }

    return createdIds;
}

async function main() {
    console.log('\n=== TEMPUS LOAD TEST ===');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Pass criteria: success >= ${(MIN_SUCCESS_RATE * 100).toFixed(0)}%, avg <= ${MAX_AVG_MS}ms\n`);

    const results = [];

    console.log('Running: POST /api/auth/login (50) ...');
    const loginRuns = await runConcurrent(50, () =>
        timedFetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        })
    );
    results.push(summarize('POST /api/auth/login', loginRuns, 50));

    const token = await loginOnce();

    console.log('Running: GET /api/meetings (100) ...');
    const meetingsGetRuns = await runConcurrent(100, () =>
        timedFetch(`${BASE_URL}/api/calendar/meetings`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        })
    );
    results.push(summarize('GET /api/meetings (actual: /api/calendar/meetings)', meetingsGetRuns, 100));

    const startBase = Date.now() + 2 * 24 * 60 * 60 * 1000;
    console.log('Running: POST /api/meetings (50) ...');
    const meetingsPostRuns = await runConcurrent(50, (i) => {
        const start = new Date(startBase + i * 90 * 60 * 1000);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        return timedFetch(`${BASE_URL}/api/calendar/meetings?force=true`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                title: `Load Meeting ${Date.now()}-${i}`,
                start_time: start.toISOString(),
                end_time: end.toISOString()
            })
        });
    });
    results.push(summarize('POST /api/meetings (actual: /api/calendar/meetings)', meetingsPostRuns, 50));

    console.log('Running: GET /api/events (100) ...');
    const eventsGetRuns = await runConcurrent(100, () =>
        timedFetch(`${BASE_URL}/api/events`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        })
    );
    results.push(summarize('GET /api/events', eventsGetRuns, 100));

    console.log('Preparing: events for join test (50) ...');
    const joinIds = await createJoinTargetEvents(token, 50);
    console.log('Running: POST /api/events/:id/join (50) ...');
    const eventJoinRuns = await runConcurrent(50, (i) =>
        timedFetch(`${BASE_URL}/api/events/${joinIds[i]}/join?force=true`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        })
    );
    results.push(summarize('POST /api/events/:id/join', eventJoinRuns, 50));

    console.log('Running: GET /api/notifications (100) ...');
    const notificationsGetRuns = await runConcurrent(100, () =>
        timedFetch(`${BASE_URL}/api/notifications`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        })
    );
    results.push(summarize('GET /api/notifications', notificationsGetRuns, 100));

    console.log('Result | Users | Avg Response | Success | Endpoint');
    console.log('--------------------------------------------------------------');
    for (const result of results) {
        printSummaryRow(result);
    }

    const allPass = results.every(r => r.pass);
    console.log(`\nOverall: ${allPass ? 'PASS' : 'FAIL'}\n`);

    process.exit(allPass ? 0 : 1);
}

main().catch((error) => {
    console.error(`\nLoad test failed: ${error.message}\n`);
    process.exit(1);
});
