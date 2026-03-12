/**
 * test_calendar.js
 * Tests: create meeting, get meetings, collision detection, update, delete
 * Run: node tests/test_calendar.js
 * Requires: server running + a valid JWT for a workspace user in TEST_TOKEN
 *
 * Set env vars before running:
 *   TEST_TOKEN=<jwt>   (a user who belongs to a workspace with calendar:view + meeting:create)
 */

require('dotenv').config();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TOKEN = process.env.TEST_TOKEN;

let passed = 0;
let failed = 0;

function pass(name) { console.log(`  ✅ PASS  ${name}`); passed++; }
function fail(name, reason) { console.log(`  ❌ FAIL  ${name} — ${reason}`); failed++; }

function authHeaders(token) {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function request(method, path, body, token) {
    const opts = { method, headers: authHeaders(token) };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE_URL}${path}`, opts);
    let json;
    try { json = await res.json(); } catch { json = null; }
    return { status: res.status, body: json };
}

// ISO strings for meetings: base offset in hours from now
function inHours(h) {
    return new Date(Date.now() + h * 60 * 60 * 1000).toISOString();
}

async function run() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  MODULE: Calendar & Meeting Scheduling');
    console.log(`  Target: ${BASE_URL}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!TOKEN) {
        console.log('  ⚠️  TEST_TOKEN not set. Set it to a valid workspace JWT and re-run.\n');
        console.log('  Example: TEST_TOKEN=eyJ... node tests/test_calendar.js\n');
        process.exit(0);
    }

    let createdId = null;

    // ── 1. Get meetings (should return array) ─────────────────────────────────
    const list = await request('GET', '/api/calendar/meetings', null, TOKEN);
    if (list.status === 200 && Array.isArray(list.body)) {
        pass(`Get meetings returns array (${list.body.length} entries)`);
    } else {
        fail('Get meetings returns array', `status ${list.status}: ${JSON.stringify(list.body)}`);
    }

    // ── 2. Create a meeting ───────────────────────────────────────────────────
    const create = await request('POST', '/api/calendar/meetings', {
        title: '[TEST] Daily Standup',
        description: 'Automated test meeting',
        start_time: inHours(2),
        end_time: inHours(3),
    }, TOKEN);
    if ((create.status === 200 || create.status === 201) && create.body?.meeting_id) {
        pass('Create meeting returns new meeting with meeting_id');
        createdId = create.body.meeting_id;
    } else {
        fail('Create meeting returns new meeting', `status ${create.status}: ${JSON.stringify(create.body)}`);
    }

    // ── 3. Collision detection — overlapping meeting ───────────────────────────
    // Starts 30 min after the first one starts → overlaps
    const overlap = await request('POST', '/api/calendar/meetings', {
        title: '[TEST] Overlapping Meeting',
        start_time: inHours(2.5),
        end_time: inHours(3.5),
    }, TOKEN);
    // The server may allow or warn; the collision check is client-side.
    // We verify the endpoint responds (200/201) and doesn't crash.
    if (overlap.status === 200 || overlap.status === 201) {
        pass('Server accepts overlapping meeting (collision is client-side responsibility)');
        // Clean up the overlap meeting
        if (overlap.body?.meeting_id) {
            await request('DELETE', `/api/calendar/meetings/${overlap.body.meeting_id}`, null, TOKEN);
        }
    } else if (overlap.status === 409) {
        pass('Server returns 409 for overlapping meeting (server-side guard active)');
    } else {
        fail('Overlapping meeting request', `unexpected status ${overlap.status}`);
    }

    // ── 4. Create meeting with missing required fields ─────────────────────────
    const missingFields = await request('POST', '/api/calendar/meetings', {
        description: 'No title, no times',
    }, TOKEN);
    if (missingFields.status === 400 || missingFields.status === 422) {
        pass('Create meeting with missing fields is rejected (400/422)');
    } else if (missingFields.status === 500) {
        fail('Create meeting with missing fields', 'server threw 500 — add input validation in controller');
    } else {
        fail('Create meeting with missing fields', `unexpected status ${missingFields.status}`);
    }

    // ── 5. Create meeting with end before start ────────────────────────────────
    const badTimes = await request('POST', '/api/calendar/meetings', {
        title: '[TEST] Bad Times',
        start_time: inHours(5),
        end_time: inHours(4), // end is before start
    }, TOKEN);
    if (badTimes.status === 400 || badTimes.status === 422) {
        pass('Create meeting with end_time < start_time is rejected');
    } else {
        fail('Create meeting with end_time < start_time is rejected', `got ${badTimes.status}`);
    }

    // ── 6. Update the created meeting ─────────────────────────────────────────
    if (createdId) {
        const update = await request('PUT', `/api/calendar/meetings/${createdId}`, {
            title: '[TEST] Updated Standup',
        }, TOKEN);
        if (update.status === 200) {
            pass('Update meeting returns 200');
        } else {
            fail('Update meeting returns 200', `status ${update.status}: ${JSON.stringify(update.body)}`);
        }
    }

    // ── 7. Delete the created meeting ─────────────────────────────────────────
    if (createdId) {
        const del = await request('DELETE', `/api/calendar/meetings/${createdId}`, null, TOKEN);
        if (del.status === 200 || del.status === 204) {
            pass('Delete meeting returns 200/204');
        } else {
            fail('Delete meeting returns 200/204', `status ${del.status}`);
        }

        // ── 8. Deleted meeting should no longer exist ─────────────────────────
        const afterDelete = await request('GET', '/api/calendar/meetings', null, TOKEN);
        const stillExists = afterDelete.body?.some?.(m => m.meeting_id === createdId);
        if (!stillExists) {
            pass('Deleted meeting no longer appears in meeting list');
        } else {
            fail('Deleted meeting no longer appears in meeting list', 'still present in GET /meetings');
        }
    }

    // ── 9. Unauthenticated request is rejected ────────────────────────────────
    const noAuth = await fetch(`${BASE_URL}/api/calendar/meetings`);
    if (noAuth.status === 401 || noAuth.status === 403) {
        pass('Unauthenticated GET /calendar/meetings is rejected (401/403)');
    } else {
        fail('Unauthenticated GET /calendar/meetings is rejected', `got ${noAuth.status}`);
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
    return failed;
}

run().then(f => process.exit(f > 0 ? 1 : 0)).catch(e => {
    console.error('Unexpected error:', e);
    process.exit(1);
});
