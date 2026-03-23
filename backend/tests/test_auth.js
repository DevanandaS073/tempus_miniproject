/**
 * test_auth.js
 * Tests: signup, login, get profile, update password
 * Run: node tests/test_auth.js
 * Requires: server running on BASE_URL (default http://localhost:3000)
 */

require('dotenv').config();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = `test_auth_${Date.now()}@tempus-test.com`;
const TEST_PASSWORD = 'TestPass123!';

let passed = 0;
let failed = 0;

function pass(name) {
    console.log(`  ✅ PASS  ${name}`);
    passed++;
}

function fail(name, reason) {
    console.log(`  ❌ FAIL  ${name} — ${reason}`);
    failed++;
}

async function post(path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
}

async function patch(path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
}

async function get(path, token) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${path}`, { headers });
    return { status: res.status, body: await res.json() };
}

async function run() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  MODULE: Authentication');
    console.log(`  Target: ${BASE_URL}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let token = null;

    // ── 1. Signup ────────────────────────────────────────────────────────────
    const signup = await post('/api/auth/signup', {
        name: 'Test Auth',
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
    });
    if (signup.status === 201 || signup.status === 200) {
        pass('Signup creates new user');
    } else {
        fail('Signup creates new user', `status ${signup.status}: ${JSON.stringify(signup.body)}`);
    }

    // ── 2. Duplicate signup ───────────────────────────────────────────────────
    const dup = await post('/api/auth/signup', {
        name: 'Test Auth',
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
    });
    if (dup.status === 400 || dup.status === 409) {
        pass('Duplicate signup is rejected');
    } else {
        fail('Duplicate signup is rejected', `expected 400/409 got ${dup.status}`);
    }

    // ── 3. Login with correct credentials ────────────────────────────────────
    const login = await post('/api/auth/login', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
    });
    if (login.status === 200 && login.body.token) {
        pass('Login with correct credentials returns JWT');
        token = login.body.token;
    } else {
        fail('Login with correct credentials returns JWT', `status ${login.status}: ${JSON.stringify(login.body)}`);
    }

    // ── 4. Login with wrong password ──────────────────────────────────────────
    const badLogin = await post('/api/auth/login', {
        email: TEST_EMAIL,
        password: 'WrongPassword!',
    });
    if (badLogin.status === 401 || badLogin.status === 400) {
        pass('Login with wrong password is rejected (401/400)');
    } else {
        fail('Login with wrong password is rejected', `expected 401/400 got ${badLogin.status}`);
    }

    // ── 5. Login with unknown email ───────────────────────────────────────────
    const unknownLogin = await post('/api/auth/login', {
        email: 'nobody@no.com',
        password: TEST_PASSWORD,
    });
    if (unknownLogin.status === 404 || unknownLogin.status === 401 || unknownLogin.status === 400) {
        pass('Login with unknown email is rejected');
    } else {
        fail('Login with unknown email is rejected', `got ${unknownLogin.status}`);
    }

    // ── 6. Update password (requires valid token) ─────────────────────────────
    if (token) {
        const pwChange = await patch('/api/auth/password', {
            currentPassword: TEST_PASSWORD,
            newPassword: 'NewPass456!',
        }, token);
        if (pwChange.status === 200) {
            pass('Password update with correct current password succeeds');
        } else {
            fail('Password update with correct current password succeeds', `status ${pwChange.status}: ${JSON.stringify(pwChange.body)}`);
        }

        // ── 7. Old password no longer works ──────────────────────────────────
        const oldLoginAfterChange = await post('/api/auth/login', {
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
        });
        if (oldLoginAfterChange.status === 401 || oldLoginAfterChange.status === 400) {
            pass('Old password rejected after password change');
        } else {
            fail('Old password rejected after password change', `got ${oldLoginAfterChange.status}`);
        }

        // ── 8. New password works ─────────────────────────────────────────────
        const newLoginAfterChange = await post('/api/auth/login', {
            email: TEST_EMAIL,
            password: 'NewPass456!',
        });
        if (newLoginAfterChange.status === 200 && newLoginAfterChange.body.token) {
            pass('New password accepted after password change');
        } else {
            fail('New password accepted after password change', `got ${newLoginAfterChange.status}`);
        }
    }

    // ── 9. Protected route without token ──────────────────────────────────────
    const noToken = await patch('/api/auth/password', { currentPassword: 'x', newPassword: 'y' });
    if (noToken.status === 401 || noToken.status === 403) {
        pass('Protected route rejects request without token');
    } else {
        fail('Protected route rejects request without token', `got ${noToken.status}`);
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
    return failed;
}

run().then(f => process.exit(f > 0 ? 1 : 0)).catch(e => {
    console.error('Unexpected error:', e);
    process.exit(1);
});
