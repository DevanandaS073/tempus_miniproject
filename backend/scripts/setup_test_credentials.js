const fs = require('fs/promises');
const path = require('path');
const readline = require('readline');

const ENV_PATH = path.resolve(__dirname, '..', '.env');

function createPrompt() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
}

function ask(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer.trim()));
    });
}

function formatEnvValue(value) {
    if (value === '') return '""';
    if (/\s|#|"|\\/.test(value)) {
        return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
    return value;
}

function upsertEnv(content, updates) {
    let lines = content.length ? content.split(/\r?\n/) : [];

    for (const [key, rawValue] of Object.entries(updates)) {
        const newLine = `${key}=${formatEnvValue(rawValue)}`;
        const matcher = new RegExp(`^\\s*${key}=`);

        let replaced = false;
        const nextLines = [];

        for (const line of lines) {
            if (matcher.test(line)) {
                if (!replaced) {
                    nextLines.push(newLine);
                    replaced = true;
                }
            } else {
                nextLines.push(line);
            }
        }

        if (!replaced) {
            if (nextLines.length > 0 && nextLines[nextLines.length - 1] !== '') {
                nextLines.push('');
            }
            nextLines.push(newLine);
        }

        lines = nextLines;
    }

    return `${lines.join('\n').replace(/\n*$/, '')}\n`;
}

async function readEnvFile() {
    try {
        const content = await fs.readFile(ENV_PATH, 'utf8');
        return { content, exists: true };
    } catch (error) {
        if (error.code === 'ENOENT') {
            return { content: '', exists: false };
        }
        throw error;
    }
}

async function backupEnvIfExists(originalContent, exists) {
    if (!exists) return null;
    const backupPath = `${ENV_PATH}.backup.${Date.now()}`;
    await fs.writeFile(backupPath, originalContent, 'utf8');
    return backupPath;
}

async function safeWriteEnv(content) {
    const tempPath = `${ENV_PATH}.tmp`;
    await fs.writeFile(tempPath, content, 'utf8');
    await fs.rename(tempPath, ENV_PATH);
}

async function collectCredentials() {
    const rl = createPrompt();

    try {
        console.log('\nTest credential setup (writes to app/backend/.env)\n');

        let adminEmail = '';
        while (!adminEmail) {
            adminEmail = await ask(rl, 'Admin login email (required): ');
        }

        let adminPassword = '';
        while (!adminPassword) {
            adminPassword = await ask(rl, 'Admin login password (required): ');
        }

        const addWorker = await ask(rl, 'Configure worker login too? (y/N): ');

        let workerEmail = '';
        let workerPassword = '';

        if (/^y(es)?$/i.test(addWorker)) {
            workerEmail = await ask(rl, 'Worker login email (optional, enter to skip): ');
            if (workerEmail) {
                workerPassword = await ask(rl, 'Worker login password (required if worker email set): ');
                while (!workerPassword) {
                    workerPassword = await ask(rl, 'Worker login password (required if worker email set): ');
                }
            }
        }

        return {
            adminEmail,
            adminPassword,
            workerEmail,
            workerPassword,
        };
    } finally {
        rl.close();
    }
}

async function main() {
    const { adminEmail, adminPassword, workerEmail, workerPassword } = await collectCredentials();

    const { content: originalContent, exists } = await readEnvFile();

    const updates = {
        TEST_LOGIN_EMAIL: adminEmail,
        TEST_LOGIN_PASSWORD: adminPassword,
    };

    if (workerEmail) {
        updates.TEST_WORKER_LOGIN_EMAIL = workerEmail;
        updates.TEST_WORKER_LOGIN_PASSWORD = workerPassword;
    }

    const nextContent = upsertEnv(originalContent, updates);
    const backupPath = await backupEnvIfExists(originalContent, exists);
    await safeWriteEnv(nextContent);

    console.log('\n✅ Test credentials saved to .env');
    console.log('   - TEST_LOGIN_EMAIL');
    console.log('   - TEST_LOGIN_PASSWORD');
    if (workerEmail) {
        console.log('   - TEST_WORKER_LOGIN_EMAIL');
        console.log('   - TEST_WORKER_LOGIN_PASSWORD');
    }
    if (backupPath) {
        console.log(`\nℹ️  Backup created: ${path.basename(backupPath)}`);
    }
    console.log('\nNext: npm run test:all:auto\n');
}

main().catch((error) => {
    console.error(`\n❌ Failed to set test credentials: ${error.message}\n`);
    process.exit(1);
});
