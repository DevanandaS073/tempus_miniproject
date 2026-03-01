const http = require('http');

const optionsSignup = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/signup',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};

const signupReq = http.request(optionsSignup, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Signup Res:', data);

        // Login to get token
        const loginReq = http.request({
            ...optionsSignup,
            path: '/api/auth/login'
        }, (res2) => {
            let data2 = '';
            res2.on('data', chunk => data2 += chunk);
            res2.on('end', () => {
                const token = JSON.parse(data2).token;
                console.log('Login Token:', token ? 'Got Token' : 'FAIL');

                // Create Company
                const compReq = http.request({
                    hostname: 'localhost',
                    port: 3000,
                    path: '/api/companies',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }, (res3) => {
                    let data3 = '';
                    res3.on('data', chunk => data3 += chunk);
                    res3.on('end', () => {
                        console.log('FINAL CREATED COMPANY RES:', JSON.stringify(JSON.parse(data3), null, 2));
                    });
                });
                compReq.write(JSON.stringify({ name: "MegaCorp " + Date.now() }));
                compReq.end();

            });
        });
        loginReq.write(JSON.stringify({ email: "founder7@test.com", password: "password123" }));
        loginReq.end();
    });
});

signupReq.write(JSON.stringify({ name: "Founder Seven", email: "founder7@test.com", password: "password123" }));
signupReq.end();
