#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const outDir = path.join(projectRoot, 'out');
const homeApps = path.join(process.env.HOME || '', 'Applications');
const destination = path.join(homeApps, 'Menace Agent.app');

function findPackagedApp() {
    if (!fs.existsSync(outDir)) return null;

    const entries = fs.readdirSync(outDir);
    for (const entry of entries) {
        const candidate = path.join(outDir, entry, 'Menace Agent.app');
        if (fs.existsSync(candidate)) return candidate;
    }

    // Zip/DMG make output may nest differently
    const walk = dir => {
        for (const name of fs.readdirSync(dir)) {
            const full = path.join(dir, name);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
                if (name === 'Menace Agent.app') return full;
                const nested = walk(full);
                if (nested) return nested;
            }
        }
        return null;
    };

    return walk(outDir);
}

const packagedApp = findPackagedApp();
if (!packagedApp) {
    console.error('No packaged Menace Agent.app found. Run: npm run package:macos');
    process.exit(1);
}

fs.mkdirSync(homeApps, { recursive: true });
if (fs.existsSync(destination)) {
    fs.rmSync(destination, { recursive: true, force: true });
}

execFileSync('ditto', [packagedApp, destination], { stdio: 'inherit' });
console.log(`Installed: ${destination}`);
console.log('Enable it under System Settings → Privacy & Security → Screen & System Audio Recording');
console.log('Then open it from Applications or Spotlight.');

try {
    execFileSync('open', ['-R', destination], { stdio: 'ignore' });
    execFileSync('open', ['x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'], {
        stdio: 'ignore',
    });
} catch {
    /* ignore UI open failures */
}
