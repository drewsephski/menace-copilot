#!/usr/bin/env node
'use strict';

/**
 * Authoritative macOS beta release path.
 *
 * Signs, notarizes, staples, verifies, and creates a DMG from the notarized app.
 * Set SKIP_NOTARIZE=1 only for intentional local/test artifacts.
 *
 * Required for notarized releases:
 *   APPLE_ID
 *   APPLE_APP_SPECIFIC_PASSWORD
 *   APPLE_TEAM_ID
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync, execFileSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const arch = 'arm64';
const outDir = path.join(projectRoot, 'out', `Menace Agent-darwin-${arch}`);
const appPath = path.join(outDir, 'Menace Agent.app');

const skipNotarize = process.env.SKIP_NOTARIZE === '1' || process.env.SKIP_NOTARIZE === 'true';

function run(cmd, args, opts = {}) {
    const result = spawnSync(cmd, args, {
        stdio: 'inherit',
        cwd: projectRoot,
        ...opts,
    });
    if (result.status !== 0) {
        throw new Error(`${cmd} ${args.join(' ')} failed with exit ${result.status}`);
    }
}

function runCapture(cmd, args) {
    return execFileSync(cmd, args, { encoding: 'utf8', cwd: projectRoot }).trim();
}

function requireNotarizeCredentials() {
    const appleId = process.env.APPLE_ID || '';
    const password = process.env.APPLE_APP_SPECIFIC_PASSWORD || '';
    const teamId = process.env.APPLE_TEAM_ID || '';
    if (!appleId || !password || !teamId) {
        throw new Error(
            'Notarized beta releases require APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, and APPLE_TEAM_ID'
        );
    }
    return { appleId, password, teamId };
}

function packageWithForge() {
    console.log('\n==> Packaging with electron-forge (sign + notarize via forge.config.js)');
    run('npx', ['electron-forge', 'package', '--platform=darwin', `--arch=${arch}`]);
}

function packageManual() {
    console.log('\n==> Packaging with manual script (sign only; notarization follows separately if enabled)');
    run(process.execPath, [path.join(__dirname, 'package-macos-manual.js')]);
}

function notarizeAndStaple(appBundle) {
    const { appleId, password, teamId } = requireNotarizeCredentials();
    const zipPath = path.join(os.tmpdir(), `menace-agent-notarize-${Date.now()}.zip`);

    console.log('\n==> Submitting app for notarization:', appBundle);
    run('ditto', ['-c', '-k', '--keepParent', appBundle, zipPath]);

    run('xcrun', [
        'notarytool',
        'submit',
        zipPath,
        '--apple-id',
        appleId,
        '--password',
        password,
        '--team-id',
        teamId,
        '--wait',
    ]);

    fs.rmSync(zipPath, { force: true });

    console.log('\n==> Stapling notarization ticket');
    run('xcrun', ['stapler', 'staple', appBundle]);
    run('xcrun', ['stapler', 'validate', appBundle]);
}

function verifyCodesign(appBundle) {
    console.log('\n==> Verifying codesign');
    run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appBundle]);
}

function verifyGatekeeper(appBundle) {
    console.log('\n==> Assessing Gatekeeper (spctl)');
    try {
        const output = runCapture('spctl', ['--assess', '--verbose=4', '--type', 'execute', appBundle]);
        console.log(output);
    } catch (error) {
        throw new Error(`Gatekeeper rejected the release: ${error.message}`);
    }
}

function verifyPackagedSecrets(appBundle) {
    console.log('\n==> Scanning packaged artifact for forbidden secrets');
    run(process.execPath, [path.join(__dirname, 'checks', 'verify-packaged-artifact.js'), '--app', appBundle]);
}

function createDmg() {
    console.log('\n==> Creating DMG from packaged app');
    run('npx', ['electron-forge', 'make', '--platform=darwin', '--skip-package']);
}

function findDmgArtifact() {
    const makeDir = path.join(projectRoot, 'out', 'make');
    if (!fs.existsSync(makeDir)) {
        return '';
    }

    const matches = [];
    const walk = dir => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            } else if (entry.name.endsWith('.dmg')) {
                matches.push(full);
            }
        }
    };
    walk(makeDir);
    return matches.sort().at(-1) || '';
}

function main() {
    if (!skipNotarize) {
        requireNotarizeCredentials();
    }

    if (skipNotarize) {
        packageManual();
    } else {
        try {
            packageWithForge();
        } catch (error) {
            console.warn('electron-forge package failed, falling back to manual package + notarytool:', error.message);
            packageManual();
            notarizeAndStaple(appPath);
        }
    }

    if (!fs.existsSync(appPath)) {
        throw new Error(`Packaged app not found at ${appPath}`);
    }

    verifyPackagedSecrets(appPath);
    verifyCodesign(appPath);

    if (!skipNotarize) {
        // Forge may already staple; validate and re-staple if needed.
        try {
            runCapture('xcrun', ['stapler', 'validate', appPath]);
        } catch {
            notarizeAndStaple(appPath);
        }
        verifyGatekeeper(appPath);
    } else {
        console.warn('\nSKIP_NOTARIZE is set — skipping stapler validation and Gatekeeper assessment');
    }

    const notarizedArtifact = path.resolve(appPath);
    createDmg();
    const dmgPath = findDmgArtifact();

    console.log('\n=== Beta release artifacts ===');
    console.log(`Notarized app bundle: ${notarizedArtifact}`);
    console.log(`DMG contains app from: ${notarizedArtifact}`);
    console.log(`DMG path: ${dmgPath || 'NOT FOUND'}`);
    console.log(`Notarization skipped: ${skipNotarize}`);
    console.log(`Architecture: darwin-${arch} (Apple Silicon only)`);
}

try {
    main();
} catch (error) {
    console.error('\nBeta release failed:', error.message);
    process.exit(1);
}
