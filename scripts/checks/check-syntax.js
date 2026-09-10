'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const IGNORE_DIRS = new Set(['node_modules', 'out', 'dist', '.git', 'assets']);

function collectJsFiles(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (IGNORE_DIRS.has(entry.name)) {
            continue;
        }

        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            collectJsFiles(fullPath, files);
            continue;
        }

        if (entry.name.endsWith('.js')) {
            files.push(fullPath);
        }
    }

    return files;
}

function main() {
    const files = collectJsFiles(ROOT);
    const failures = [];

    for (const file of files) {
        const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
        if (result.status !== 0) {
            failures.push({ file, error: result.stderr || result.stdout });
        }
    }

    if (failures.length > 0) {
        console.error(`Syntax check failed for ${failures.length} file(s):`);
        for (const failure of failures) {
            console.error(`\n${path.relative(ROOT, failure.file)}\n${failure.error}`);
        }
        process.exit(1);
    }

    console.log(`Syntax OK (${files.length} JavaScript files)`);
}

main();
