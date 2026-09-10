'use strict';

const fs = require('fs');
const path = require('path');
const { SECRET_PATTERNS, assertNoSecretsInPublicConfig } = require('../build-public-runtime-config');

const FORBIDDEN_ARTIFACTS = ['menace-hosted.env'];
const SCAN_ROOTS = [
    path.join(__dirname, '..', '..', 'out'),
    path.join(__dirname, '..', '..', '.packager-tmp'),
];

function listFiles(dir) {
    if (!fs.existsSync(dir)) {
        return [];
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...listFiles(fullPath));
        } else {
            files.push(fullPath);
        }
    }

    return files;
}

function scanFile(filePath) {
    const rel = path.relative(path.join(__dirname, '..', '..'), filePath);
    const basename = path.basename(filePath);

    if (FORBIDDEN_ARTIFACTS.includes(basename)) {
        throw new Error(`Forbidden packaged artifact found: ${rel}`);
    }

    if (!/\.(env|json|js|html|plist|asar|txt)$/i.test(basename) && basename !== 'menace-runtime-config.json') {
        return;
    }

    let content;
    try {
        content = fs.readFileSync(filePath, 'utf8');
    } catch {
        return;
    }

    for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(content)) {
            throw new Error(`Packaged secret pattern matched in ${rel}`);
        }
    }

    if (basename === 'menace-runtime-config.json') {
        assertNoSecretsInPublicConfig(JSON.parse(content));
    }
}

function main() {
    let scanned = 0;

    for (const root of SCAN_ROOTS) {
        for (const file of listFiles(root)) {
            scanFile(file);
            scanned++;
        }
    }

    console.log(`Packaged secret scan OK (${scanned} files checked when present)`);
}

try {
    main();
} catch (error) {
    console.error('Packaged secret check failed:', error.message);
    process.exit(1);
}
