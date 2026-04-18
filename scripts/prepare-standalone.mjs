import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

async function copyDirIfExists(from, to) {
    try {
        const stat = await fs.stat(from);
        if (!stat.isDirectory()) return;
    } catch {
        return;
    }

    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.cp(from, to, { recursive: true, force: true });
}

async function main() {
    await copyDirIfExists(
        path.join(root, '.next', 'static'),
        path.join(root, '.next', 'standalone', '.next', 'static'),
    );

    await copyDirIfExists(
        path.join(root, 'public'),
        path.join(root, '.next', 'standalone', 'public'),
    );
}

await main();