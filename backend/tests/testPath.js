async function testFetchRoles() {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'jamesgunn@example.com', password: 'password' }) // Or whatever pass the user used
    });
    const loginData = await loginRes.json();
    console.log("LOGIN RESPONSE:", loginData);

    if (!loginData.token) return;

    const rolesRes = await fetch('http://localhost:3000/api/companies/roles', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${loginData.token}` }
    });

    const rolesData = await rolesRes.json();
    console.log("ROLES RESPONSE:", rolesData);
}

testFetchRoles();
