import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const targetFile = process.argv[2] || '.env.local';
const authUserValue = process.env.AUTH_USER_VALUE || 'admin';
const envExamplePath = path.join(root, '.env.example');
const outputPath = path.resolve(root, targetFile);

function generateSecret(size = 48) {
    const base = crypto.randomBytes(Math.max(size * 2, 64)).toString('base64');
    return base.replace(/[\/+=]/g, 'A').slice(0, size);
}

function upsertKv(content, key, value) {
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    if (pattern.test(content)) {
        return content.replace(pattern, line);
    }

    const suffix = content.endsWith('\n') ? '' : '\n';
    return `${content}${suffix}${line}\n`;
}

async function main() {
    try {
        await fs.access(envExamplePath);
    } catch {
        throw new Error('Missing .env.example in repository root.');
    }

    try {
        await fs.access(outputPath);
    } catch {
        await fs.copyFile(envExamplePath, outputPath);
    }

    let content = await fs.readFile(outputPath, 'utf8');
    const authPassValue = generateSecret(40);
    const apiKeyValue = generateSecret(48);

    content = upsertKv(content, 'AUTH_USER', authUserValue);
    content = upsertKv(content, 'AUTH_PASS', authPassValue);
    content = upsertKv(content, 'API_KEY', apiKeyValue);
    await fs.writeFile(outputPath, content, 'utf8');

    console.log(`Updated ${path.relative(root, outputPath)}`);
    console.log(`AUTH_USER=${authUserValue}`);
    console.log(`AUTH_PASS=${authPassValue}`);
    console.log(`API_KEY=${apiKeyValue}`);
}

await main();