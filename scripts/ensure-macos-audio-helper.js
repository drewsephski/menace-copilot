#!/usr/bin/env node
/**
 * Local-dev helper for macOS system audio capture.
 * Copies SystemAudioDump into Electron.app/Contents/Helpers and ensures
 * Electron's Info.plist has the usage descriptions macOS 14.2+/26 need.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

if (process.platform !== 'darwin') {
    process.exit(0);
}

const projectRoot = path.join(__dirname, '..');
const electronApp = path.join(projectRoot, 'node_modules/electron/dist/Electron.app');
const helpersDir = path.join(electronApp, 'Contents/Helpers');
const plistPath = path.join(electronApp, 'Contents/Info.plist');

const sourceCandidates = [
    path.join(projectRoot, 'src/assets/CheatingDaddyAudio.app/Contents/MacOS/CheatingDaddyAudio'),
    path.join(projectRoot, 'src/assets/CheatingDaddyAudio.app/Contents/MacOS/SystemAudioDump'),
    path.join(projectRoot, 'src/assets/SystemAudioDump'),
];

const source = sourceCandidates.find(candidate => fs.existsSync(candidate));
if (!source || !fs.existsSync(electronApp)) {
    console.warn('[macos-audio] Skipping helper install — Electron.app or SystemAudioDump missing');
    process.exit(0);
}

fs.mkdirSync(helpersDir, { recursive: true });
const target = path.join(helpersDir, 'SystemAudioDump');
fs.copyFileSync(source, target);
fs.chmodSync(target, 0o755);

function ensurePlistString(key, value) {
    try {
        execFileSync('plutil', ['-replace', key, '-string', value, plistPath], { stdio: 'ignore' });
    } catch {
        try {
            execFileSync('plutil', ['-insert', key, '-string', value, plistPath], { stdio: 'ignore' });
        } catch (error) {
            console.warn(`[macos-audio] Unable to set ${key}:`, error.message);
        }
    }
}

ensurePlistString(
    'NSAudioCaptureUsageDescription',
    'Menace Agent needs system audio access to hear the interviewer from your computer speakers or headset.'
);
ensurePlistString(
    'NSScreenCaptureDescription',
    'Menace Agent needs screen capture for contextual interview assistance.'
);

console.log('[macos-audio] Installed SystemAudioDump helper into Electron.app');

// Keep ~/Applications/Menace Agent Dev.app in sync when present (easier TCC toggles)
const devApp = path.join(process.env.HOME || '', 'Applications/Menace Agent Dev.app');
const legacyDevApp = path.join(process.env.HOME || '', 'Applications/Cheating Daddy Dev.app');
for (const appPath of [devApp, legacyDevApp]) {
    const devHelper = path.join(appPath, 'Contents/Helpers/SystemAudioDump');
    if (fs.existsSync(appPath)) {
        fs.mkdirSync(path.dirname(devHelper), { recursive: true });
        fs.copyFileSync(source, devHelper);
        fs.chmodSync(devHelper, 0o755);
        console.log(`[macos-audio] Updated helper in ${path.basename(appPath)}`);
    }
}