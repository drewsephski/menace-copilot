'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { assertNoSecretsInPublicConfig, SECRET_PATTERNS } = require('../build-public-runtime-config');

const FORBIDDEN_ARTIFACTS = ['menace-hosted.env'];
const REQUIRED_RUNTIME_KEYS = ['updateManifestUrl', 'releasePageUrl', 'localAiBinariesBaseUrl', 'hostedApiBaseUrl'];

function parseArgs(argv) {
    const args = { appPath: '', requireAsar: true };
    for (let i = 2; i < argv.length; i++) {
        if (argv[i] === '--app' && argv[i + 1]) {
            args.appPath = argv[++i];
            continue;
        }
        if (argv[i] === '--no-asar-required') {
            args.requireAsar = false;
        }
    }
    return args;
}

function findDefaultAppBundle() {
    const candidates = [
        path.join(__dirname, '..', '..', 'out', 'Menace Agent-darwin-arm64', 'Menace Agent.app'),
        path.join(__dirname, '..', '..', 'out', 'Menace Agent-darwin-x64', 'Menace Agent.app'),
    ];

    return candidates.find(candidate => fs.existsSync(candidate)) || '';
}

function listFiles(dir) {
    if (!fs.existsSync(dir)) {
        return [];
    }

    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...listFiles(fullPath));
        } else {
            files.push(fullPath);
        }
    }
    return files;
}

function scanTextFile(filePath, rel) {
    const basename = path.basename(filePath);

    if (FORBIDDEN_ARTIFACTS.includes(basename)) {
        throw new Error(`Forbidden packaged artifact found: ${rel}`);
    }

    if (basename === 'app.asar') {
        return;
    }

    if (!/\.(env|json|js|html|plist|txt)$/i.test(basename) && basename !== 'menace-runtime-config.json') {
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

function extractAsar(appBundle, workDir) {
    const asarPath = path.join(appBundle, 'Contents', 'Resources', 'app.asar');
    if (!fs.existsSync(asarPath)) {
        return { asarPath: null, extractedDir: null };
    }

    const extractedDir = path.join(workDir, 'app-asar');
    fs.mkdirSync(extractedDir, { recursive: true });

    try {
        execFileSync('npx', ['--yes', '@electron/asar', 'extract', asarPath, extractedDir], {
            stdio: 'pipe',
            cwd: path.join(__dirname, '..', '..'),
        });
    } catch (error) {
        throw new Error(`Failed to extract app.asar: ${error.message}`);
    }

    return { asarPath, extractedDir };
}

function verifyRuntimeConfig(resourcesDir) {
    const configPath = path.join(resourcesDir, 'menace-runtime-config.json');
    if (!fs.existsSync(configPath)) {
        throw new Error('Missing menace-runtime-config.json in app Resources');
    }

    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assertNoSecretsInPublicConfig(parsed);

    for (const key of REQUIRED_RUNTIME_KEYS) {
        if (!(key in parsed)) {
            throw new Error(`menace-runtime-config.json missing ${key}`);
        }
    }

    return configPath;
}

function main() {
    const args = parseArgs(process.argv);
    const appBundle = args.appPath || findDefaultAppBundle();

    if (!appBundle || !fs.existsSync(appBundle)) {
        console.error('Packaged artifact verification failed: no .app bundle found.');
        console.error('Build one first (npm run package:macos) or pass --app /path/to/Menace Agent.app');
        process.exit(1);
    }

    const resourcesDir = path.join(appBundle, 'Contents', 'Resources');
    if (!fs.existsSync(resourcesDir)) {
        throw new Error(`Resources directory missing in ${appBundle}`);
    }

    verifyRuntimeConfig(resourcesDir);

    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'menace-package-verify-'));
    const { asarPath, extractedDir } = extractAsar(appBundle, workDir);

    if (args.requireAsar && !asarPath) {
        throw new Error('app.asar missing from packaged app Resources');
    }

    const scanRoots = [resourcesDir];
    if (extractedDir) {
        scanRoots.push(extractedDir);
    }

    let scanned = 0;
    for (const root of scanRoots) {
        for (const file of listFiles(root)) {
            const rel = path.relative(appBundle, file);
            scanTextFile(file, rel);
            scanned++;
        }
    }

    if (scanned === 0) {
        throw new Error('Packaged artifact verification inspected zero files');
    }

    fs.rmSync(workDir, { recursive: true, force: true });

    console.log(
        `Packaged artifact verification OK (${scanned} files inspected; asar=${Boolean(asarPath)}; app=${path.basename(appBundle)})`
    );
}

try {
    main();
} catch (error) {
    console.error('Packaged artifact verification failed:', error.message);
    process.exit(1);
}
