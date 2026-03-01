const http = require('http');

// 1. Signup
const signupReq = http.request({
    hostname: 'localhost', port: 3000, path: '/api/auth/signup', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
}, (resS) => {
    resS.on('data', () => { });
    resS.on('end', () => {

        // 2. Login
        const loginReq = http.request({
            hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (resL) => {
            let logData = '';
            resL.on('data', c => logData += c);
            resL.on('end', () => {
                const token = JSON.parse(logData).token;

                // 3. Create Company
                const compReq = http.request({
                    hostname: 'localhost', port: 3000, path: '/api/companies', method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                }, (resC) => {
                    let compData = '';
                    resC.on('data', c => compData += c);
                    resC.on('end', () => {
                        const finalToken = JSON.parse(compData).token;

                        // 4. Test Network Users
                        const netReq = http.request({
                            hostname: 'localhost', port: 3000, path: '/api/network/users', method: 'GET',
                            headers: { 'Authorization': `Bearer ${finalToken}` }
                        }, (res2) => {
                            let data2 = '';
                            res2.on('data', c => data2 += c);
                            res2.on('end', () => console.log('NETWORK RES:', res2.statusCode, data2));
                        });
                        netReq.end();

                        // 5. Test Events
                        const evtReq = http.request({
                            hostname: 'localhost', port: 3000, path: '/api/events', method: 'GET',
                            headers: { 'Authorization': `Bearer ${finalToken}` }
                        }, (res3) => {
                            let data3 = '';
                            res3.on('data', c => data3 += c);
                            res3.on('end', () => console.log('EVENTS RES:', res3.statusCode, data3));
                        });
                        evtReq.end();

                        // 6. Test Calendar Meetings
                        const calReq = http.request({
                            hostname: 'localhost', port: 3000, path: '/api/calendar/meetings', method: 'GET',
                            headers: { 'Authorization': `Bearer ${finalToken}` }
                        }, (res4) => {
                            let data4 = '';
                            res4.on('data', c => data4 += c);
                            res4.on('end', () => console.log('CALENDAR RES:', res4.statusCode, data4));
                        });
                        calReq.end();
                    });
                });
                compReq.write(JSON.stringify({ name: "MegaCorp ErrorTest2" }));
                compReq.end();
            });
        });
        loginReq.write(JSON.stringify({ email: "tester2@test.com", password: "password123" }));
        loginReq.end();
    });
});
signupReq.write(JSON.stringify({ name: "Tester Two", email: "tester2@test.com", password: "password123" }));
signupReq.end();
