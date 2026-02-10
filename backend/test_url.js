const { URL } = require('url');

try {
    const connectionString = "postgresql://postgres:postgres@123@localhost:5432/tempus_db?schema=public";
    console.log(`Testing URL: ${connectionString}`);
    const url = new URL(connectionString);
    console.log("Hostname:", url.hostname);
    console.log("Username:", url.username);
    console.log("Password:", url.password);
    console.log("Port:", url.port);
} catch (e) {
    console.error("Error parsing URL:", e.message);
}
