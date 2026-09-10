'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const CHECKS = [
    'check-syntax.js',
    'check-session-profiles.js',
    'check-storage-migration.js',
    'check-update-source.js',
    'check-prompt-fallback.js',
    'check-startup-smoke.js',
];

function runCheck(scriptName) {
    const scriptPath = path.join(__dirname, scriptName);
    const result = spawnSync(process.execPath, [scriptPath], {
        encoding: 'utf8',
        stdio: 'pipe',
    });

    if (result.status !== 0) {
        process.stdout.write(result.stdout || '');
        process.stderr.write(result.stderr || '');
        return false;
    }

    process.stdout.write((result.stdout || '').trim() + '\n');
    return true;
}

function main() {
    let failed = 0;

    for (const check of CHECKS) {
        const ok = runCheck(check);
        if (!ok) {
            failed++;
            console.error(`FAILED: ${check}`);
        }
    }

    if (failed > 0) {
        console.error(`\n${failed} check(s) failed`);
        process.exit(1);
    }

    console.log(`\nAll ${CHECKS.length} checks passed`);
}

main();
