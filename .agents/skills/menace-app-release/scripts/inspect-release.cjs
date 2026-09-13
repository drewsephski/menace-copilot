#!/usr/bin/env node
'use strict';

// Read-only inspection. Does not load .env, credentials, Electron, or perform network requests.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function parseArgs(argv) {
    const result = { repo: process.cwd(), app: null };
    for (let i = 0; i < argv.length; i++) {
        const flag = argv[i];
        if (flag === '--help') {
            console.log('Usage: node inspect-release.cjs [--repo PATH] [--app PATH]');
            process.exit(0);
        }
        if (!['--repo', '--app'].includes(flag) || !argv[i + 1] || argv[i + 1].startsWith('--')) {
            throw new Error(`Invalid argument: ${flag}. Use --help.`);
        }
        result[flag.slice(2)] = path.resolve(argv[++i]);
    }
    return result;
}

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function describeUrl(value) {
    if (!value) return { configured: false };
    try {
        const url = new URL(value);
        return {
            configured: true,
            https: url.protocol === 'https:',
            origin: url.origin,
            hasEmbeddedCredentials: Boolean(url.username || url.password),
        };
    } catch {
        return { configured: true, valid: false };
    }
}

function inspect(args) {
    const repo = path.resolve(args.repo);
    const pkg = readJson(path.join(repo, 'package.json'));
    if (pkg.productName !== 'Menace Agent') throw new Error('Expected the Menace Agent repository.');
    const read = file => fs.readFileSync(path.join(repo, file), 'utf8');
    const checker = read('src/utils/updateChecker.js');
    const main = read('src/index.js');
    const build = read('scripts/package-macos-manual.js');
    const workflowPath = '.github/workflows/beta-release.yml';
    const workflow = fs.existsSync(path.join(repo, workflowPath)) ? read(workflowPath) : '';
    const report = {
        repository: repo,
        sourceVersion: pkg.version,
        scripts: Object.fromEntries(['lint', 'typecheck', 'check', 'beta:macos', 'verify:package'].map(name => [name, pkg.scripts?.[name] || null])),
        sourceObservations: {
            legacyVersionManifestDetected: checker.includes('payload.version'),
            releasePageActionDetected: main.includes('openExternalWithoutBlocking(releaseUrl)'),
            updaterApiMentionedInMainOrChecker: /autoUpdater|quitAndInstall|downloadUpdate/.test(main + checker),
            manualPackagerSetsBuildVersion: /CFBundleVersion\s*:/.test(build),
            ciUploadsActionsArtifacts: workflow.includes('actions/upload-artifact'),
            ciUsesNpmInstall: workflow.includes('npm ci'),
            ciPublishesGithubRelease: workflow.includes('gh release edit'),
        },
        installed: null,
        notes: ['Source observations are hints for manual review, not proof that updates work.'],
    };
    if (!args.app) {
        report.notes.push('Pass --app with the actual installed bundle to inspect its update URLs.');
        return report;
    }
    const app = path.resolve(args.app);
    report.installed = { path: app, exists: fs.existsSync(app) };
    if (!report.installed.exists) {
        report.notes.push('Installed app not found at the supplied path.');
        return report;
    }
    const runtimePath = path.join(app, 'Contents/Resources/menace-runtime-config.json');
    const runtime = fs.existsSync(runtimePath) ? readJson(runtimePath) : {};
    report.installed.runtimeConfigExists = fs.existsSync(runtimePath);
    report.installed.updateManifest = describeUrl(runtime.updateManifestUrl);
    report.installed.releasePage = describeUrl(runtime.releasePageUrl);
    report.installed.hostedGateway = describeUrl(runtime.hostedApiBaseUrl);
    if (process.platform === 'darwin') {
        const plist = path.join(app, 'Contents/Info.plist');
        report.installed.version = execFileSync('/usr/bin/plutil', ['-extract', 'CFBundleShortVersionString', 'raw', plist], { encoding: 'utf8' }).trim();
        report.installed.buildVersion = execFileSync('/usr/bin/plutil', ['-extract', 'CFBundleVersion', 'raw', plist], { encoding: 'utf8' }).trim();
    }
    report.notes.push('Legacy runtime update URLs do not control the native installer in 1.0.1+. Inspect the installed ASAR updateSource and updateChecker modules.');
    if (!report.sourceObservations.updaterApiMentionedInMainOrChecker) {
        report.notes.push('No installer API detected in the inspected modules. Trace imports before claiming in-app installation.');
    }
    return report;
}

try {
    console.log(JSON.stringify(inspect(parseArgs(process.argv.slice(2))), null, 2));
} catch (error) {
    console.error(`Release inspection failed: ${error.message}`);
    process.exitCode = 1;
}
