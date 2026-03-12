/**
 * test_events.js
 * Tests: list events, create event, join event, past-event block,
 *        collision on join, leave event, delete event
 * Run: node tests/test_events.js
 * Requires: TEST_TOKEN — JWT for an admin-level workspace user
 *           (needs event:view, event:create, event:join, event:delete)
 */

require('dotenv').config();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TOKEN = process.env.TEST_TOKEN;

let passed = 0;
let failed = 0;

function pass(name) { console.log(`  ✅ PASS  ${name}`); passed++; }
function fail(name, reason) { console.log(`  ❌ FAIL  ${name} — ${reason}`); failed++; }

async function request(method, path, body, token) {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE_URL}${path}`, opts);
    let json;
    try { json = await res.json(); } catch { json = null; }
    return { status: res.status, body: json };
}

function inDays(d) {
    return new Date(Date.now() + d * 24 * 60 * 60 * 1000).toISOString();
}

async function run() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  MODULE: Event Management & Participation');
    console.log(`  Target: ${BASE_URL}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!TOKEN) {
        console.log('  ⚠️  TEST_TOKEN not set. Set it to a valid admin workspace JWT and re-run.\n');
        process.exit(0);
    }

    let futureEventId = null;
    let pastEventId = null;
    let collisionEventId = null;

    // ── 1. List all events ────────────────────────────────────────────────────
    const list = await request('GET', '/api/events', null, TOKEN);
    if (list.status === 200 && Array.isArray(list.body)) {
        pass(`GET /events returns array (${list.body.length} events)`);
    } else {
        fail('GET /events returns array', `status ${list.status}: ${JSON.stringify(list.body)}`);
    }

    // ── 2. Create a future event ──────────────────────────────────────────────
    const createFuture = await request('POST', '/api/events', {
        title: '[TEST] Future Workshop',
        event_type: 'workshop',
        description: 'Automated test event',
        start_date: inDays(5),
        end_date: inDays(6),
        location: 'Test Room A',
    }, TOKEN);
    if ((createFuture.status === 200 || createFuture.status === 201) && createFuture.body?.event_id) {
        pass('Create future event succeeds');
        futureEventId = createFuture.body.event_id;
    } else {
        fail('Create future event succeeds', `status ${createFuture.status}: ${JSON.stringify(createFuture.body)}`);
    }

    // ── 3. Create a past event ────────────────────────────────────────────────
    const createPast = await request('POST', '/api/events', {
        title: '[TEST] Past Seminar',
        event_type: 'seminar',
        start_date: inDays(-10),
        end_date: inDays(-9),
        location: 'Test Room B',
    }, TOKEN);
    if ((createPast.status === 200 || createPast.status === 201) && createPast.body?.event_id) {
        pass('Create past event succeeds (admin can backdate)');
        pastEventId = createPast.body.event_id;
    } else {
        fail('Create past event succeeds', `status ${createPast.status}: ${JSON.stringify(createPast.body)}`);
    }

    // ── 4. Join a future event ────────────────────────────────────────────────
    if (futureEventId) {
        const join = await request('POST', `/api/events/${futureEventId}/join`, {}, TOKEN);
        if (join.status === 200 || join.status === 201) {
            pass('Join future event succeeds');
        } else {
            fail('Join future event succeeds', `status ${join.status}: ${JSON.stringify(join.body)}`);
        }
    }

    // ── 5. Joining a past event is blocked ────────────────────────────────────
    if (pastEventId) {
        const joinPast = await request('POST', `/api/events/${pastEventId}/join`, {}, TOKEN);
        if (joinPast.status === 400) {
            pass('Joining past event is blocked with 400');
        } else {
            fail('Joining past event is blocked', `expected 400 got ${joinPast.status}: ${JSON.stringify(joinPast.body)}`);
        }
    }

    // ── 6. Joining the same event twice returns 409 ───────────────────────────
    if (futureEventId) {
        const joinAgain = await request('POST', `/api/events/${futureEventId}/join`, {}, TOKEN);
        if (joinAgain.status === 409 || joinAgain.status === 400) {
            pass('Joining same event twice returns 409/400');
        } else {
            fail('Joining same event twice returns 409/400', `got ${joinAgain.status}`);
        }
    }

    // ── 7. Create a colliding event and join it — should get 409 ─────────────
    if (futureEventId) {
        const createCollision = await request('POST', '/api/events', {
            title: '[TEST] Collision Event',
            event_type: 'workshop',
            start_date: inDays(5),    // same window as futureEvent
            end_date: inDays(5.5),
            location: 'Test Room C',
        }, TOKEN);
        if ((createCollision.status === 200 || createCollision.status === 201) && createCollision.body?.event_id) {
            collisionEventId = createCollision.body.event_id;
            const joinCollision = await request('POST', `/api/events/${collisionEventId}/join`, {}, TOKEN);
            if (joinCollision.status === 409 && joinCollision.body?.collision) {
                pass('Joining colliding event returns 409 with collision details');
            } else if (joinCollision.status === 200 || joinCollision.status === 201) {
                fail('Joining colliding event should return 409', 'got 200 — server-side collision check may be missing');
            } else {
                fail('Joining colliding event returns 409', `got ${joinCollision.status}: ${JSON.stringify(joinCollision.body)}`);
            }
        }
    }

    // ── 8. Force-join a colliding event ───────────────────────────────────────
    if (collisionEventId) {
        const forceJoin = await request('POST', `/api/events/${collisionEventId}/join?force=true`, {}, TOKEN);
        if (forceJoin.status === 200 || forceJoin.status === 201) {
            pass('Force-join (?force=true) overrides collision and succeeds');
        } else {
            fail('Force-join overrides collision', `got ${forceJoin.status}: ${JSON.stringify(forceJoin.body)}`);
        }
    }

    // ── 9. Leave an event ─────────────────────────────────────────────────────
    if (futureEventId) {
        const leave = await request('DELETE', `/api/events/${futureEventId}/join`, null, TOKEN);
        if (leave.status === 200 || leave.status === 204) {
            pass('Leave event (DELETE /join) succeeds');
        } else {
            fail('Leave event succeeds', `status ${leave.status}`);
        }
    }

    // ── 10. Get participants for an event ─────────────────────────────────────
    if (futureEventId) {
        const parts = await request('GET', `/api/events/${futureEventId}/participants`, null, TOKEN);
        if (parts.status === 200 && Array.isArray(parts.body)) {
            pass(`GET participants returns array (${parts.body.length} entries)`);
        } else {
            fail('GET participants returns array', `status ${parts.status}`);
        }
    }

    // ── Cleanup: delete test events ───────────────────────────────────────────
    for (const id of [futureEventId, pastEventId, collisionEventId]) {
        if (id) await request('DELETE', `/api/events/${id}`, null, TOKEN);
    }
    console.log('  🧹 Test events cleaned up');

    // ── 11. Unauthenticated request ───────────────────────────────────────────
    const noAuth = await fetch(`${BASE_URL}/api/events`);
    if (noAuth.status === 401 || noAuth.status === 403) {
        pass('Unauthenticated GET /events rejected (401/403)');
    } else {
        fail('Unauthenticated GET /events rejected', `got ${noAuth.status}`);
    }

    console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
    return failed;
}

run().then(f => process.exit(f > 0 ? 1 : 0)).catch(e => {
    console.error('Unexpected error:', e);
    process.exit(1);
});
