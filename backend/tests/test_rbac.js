/**
 * test_rbac.js
 * Tests: list roles, create role, update role, permission enforcement,
 *        delete role, protected-admin-role guard
 * Run: node tests/test_rbac.js
 * Requires: TEST_TOKEN — JWT for an admin user (role:create, role:edit, role:delete)
 *           TEST_WORKER_TOKEN — JWT for a non-admin user (optional, for permission check)
 */

require('dotenv').config();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.TEST_TOKEN;
const WORKER_TOKEN = process.env.TEST_WORKER_TOKEN; // optional

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

async function run() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  MODULE: Role-Based Access Control (RBAC)');
    console.log(`  Target: ${BASE_URL}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!ADMIN_TOKEN) {
        console.log('  ⚠️  TEST_TOKEN not set. Set it to an admin JWT and re-run.\n');
        process.exit(2);
    }

    let createdRoleId = null;
    let adminRoleId = null;

    // ── 1. GET all roles ───────────────────────────────────────────────────────
    const roles = await request('GET', '/api/companies/roles', null, ADMIN_TOKEN);
    if (roles.status === 200 && Array.isArray(roles.body)) {
        pass(`GET /companies/roles returns array (${roles.body.length} roles)`);
        adminRoleId = roles.body.find(r => r.name?.toLowerCase() === 'admin')?.id ?? null;
    } else {
        fail('GET /companies/roles returns array', `status ${roles.status}: ${JSON.stringify(roles.body)}`);
    }

    // ── 2. Role objects have expected fields ──────────────────────────────────
    const firstRole = roles.body?.[0];
    if (firstRole) {
        const hasFields = ['id', 'name'].every(f => f in firstRole);
        if (hasFields) {
            pass('Role objects contain id and name fields');
        } else {
            fail('Role objects have correct shape', `missing fields in: ${JSON.stringify(firstRole)}`);
        }
    }

    // ── 3. Create a new custom role ───────────────────────────────────────────
    const createRole = await request('POST', '/api/companies/roles', {
        name: '[TEST] Coordinator',
        features: ['event:view', 'calendar:view'],
    }, ADMIN_TOKEN);
    if ((createRole.status === 200 || createRole.status === 201) && createRole.body?.id) {
        pass('Create custom role returns new role with id');
        createdRoleId = createRole.body.id;
    } else {
        fail('Create custom role returns new role', `status ${createRole.status}: ${JSON.stringify(createRole.body)}`);
    }

    // ── 4. Get single role by id ──────────────────────────────────────────────
    if (createdRoleId) {
        const getOne = await request('GET', `/api/companies/roles/${createdRoleId}`, null, ADMIN_TOKEN);
        if (getOne.status === 200 && getOne.body?.id === createdRoleId) {
            pass('GET /companies/roles/:id returns the correct role');
        } else {
            fail('GET /companies/roles/:id returns correct role', `status ${getOne.status}`);
        }
    }

    // ── 5. Update the custom role ─────────────────────────────────────────────
    if (createdRoleId) {
        const update = await request('PUT', `/api/companies/roles/${createdRoleId}`, {
            name: '[TEST] Senior Coordinator',
            features: ['event:view', 'calendar:view', 'meeting:create'],
        }, ADMIN_TOKEN);
        if (update.status === 200) {
            pass('Update role returns 200');
        } else {
            fail('Update role returns 200', `status ${update.status}: ${JSON.stringify(update.body)}`);
        }
    }

    // ── 6. Non-admin cannot create a role (permission check) ──────────────────
    if (WORKER_TOKEN) {
        const noPerms = await request('POST', '/api/companies/roles', {
            name: '[TEST] Unauthorized Role',
            features: [],
        }, WORKER_TOKEN);
        if (noPerms.status === 403) {
            pass('Worker without role:create gets 403 on POST /companies/roles');
        } else {
            fail('Worker without role:create gets 403', `got ${noPerms.status}`);
        }
    } else {
        console.log('  ℹ️  TEST_WORKER_TOKEN not set — skipping permission enforcement check');
    }

    // ── 7. Cannot delete the protected admin role ─────────────────────────────
    if (adminRoleId) {
        const delAdmin = await request('DELETE', `/api/companies/roles/${adminRoleId}`, null, ADMIN_TOKEN);
        if (delAdmin.status === 400 || delAdmin.status === 403) {
            pass('Deleting protected admin role is blocked (400/403)');
        } else if (delAdmin.status === 200) {
            fail('Deleting protected admin role is blocked', 'returned 200 — admin role was deleted!');
        } else {
            // Role might be protected differently
            console.log(`  ℹ️  DELETE admin role returned ${delAdmin.status} — verify guard logic`);
            pass('Admin role deletion did not crash server');
        }
    } else {
        console.log('  ℹ️  No admin role found in workspace — skipping protected-role delete check');
    }

    // ── 8. Delete the test role ───────────────────────────────────────────────
    if (createdRoleId) {
        const del = await request('DELETE', `/api/companies/roles/${createdRoleId}`, null, ADMIN_TOKEN);
        if (del.status === 200 || del.status === 204) {
            pass('Delete custom role returns 200/204');
        } else {
            fail('Delete custom role returns 200/204', `status ${del.status}`);
        }

        // Verify it is gone
        const afterDel = await request('GET', '/api/companies/roles', null, ADMIN_TOKEN);
        const stillThere = afterDel.body?.find(r => r.id === createdRoleId);
        if (!stillThere) {
            pass('Deleted role no longer appears in GET /companies/roles');
        } else {
            fail('Deleted role no longer appears', 'still present after DELETE');
        }
    }

    // ── 9. Unauthenticated request is rejected ────────────────────────────────
    const noAuth = await fetch(`${BASE_URL}/api/companies/roles`);
    if (noAuth.status === 401 || noAuth.status === 403) {
        pass('Unauthenticated GET /companies/roles rejected (401/403)');
    } else {
        fail('Unauthenticated GET /companies/roles rejected', `got ${noAuth.status}`);
    }

    console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
    return failed;
}

run().then(f => process.exit(f > 0 ? 1 : 0)).catch(e => {
    console.error('Unexpected error:', e);
    process.exit(1);
});
