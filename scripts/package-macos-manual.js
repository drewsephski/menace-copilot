#!/usr/bin/env node
/**
 * Manual macOS package for Menace Agent.
 * Used when electron-packager exits before finishing extract in this environment.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const outDir = path.join(projectRoot, 'out', 'Menace Agent-darwin-arm64');
const appPath = path.join(outDir, 'Menace Agent.app');
const electronCache =
    process.env.ELECTRON_CACHE ||
    path.join(process.env.HOME || '', 'Library/Caches/electron');

function findElectronZip() {
    const preferred = path.join(
        electronCache,
        '3fc8b100354a78e048c5a36cd89ea3c5ae19222fb41a8b533daedaae0879fe84',
        'electron-v30.5.1-darwin-arm64.zip'
    );
    if (fs.existsSync(preferred)) return preferred;

    const walk = dir => {
        if (!fs.existsSync(dir)) return null;
        for (const name of fs.readdirSync(dir)) {
            const full = path.join(dir, name);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
                const nested = walk(full);
                if (nested) return nested;
            } else if (name === 'electron-v30.5.1-darwin-arm64.zip') {
                return full;
            }
        }
        return null;
    };
    return walk(electronCache);
}

function run(cmd, args, opts = {}) {
    const result = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
    if (result.status !== 0) {
        throw new Error(`${cmd} ${args.join(' ')} failed with ${result.status}`);
    }
}

function copyHelper(appBundle) {
    const helpersDir = path.join(appBundle, 'Contents', 'Helpers');
    fs.mkdirSync(helpersDir, { recursive: true });
    const sourceCandidates = [
        path.join(projectRoot, 'src/assets/CheatingDaddyAudio.app/Contents/MacOS/CheatingDaddyAudio'),
        path.join(projectRoot, 'src/assets/CheatingDaddyAudio.app/Contents/MacOS/SystemAudioDump'),
        path.join(projectRoot, 'src/assets/SystemAudioDump'),
    ];
    const source = sourceCandidates.find(candidate => fs.existsSync(candidate));
    if (!source) throw new Error('SystemAudioDump helper binary not found');
    const target = path.join(helpersDir, 'SystemAudioDump');
    fs.copyFileSync(source, target);
    fs.chmodSync(target, 0o755);
}

function main() {
    const zip = findElectronZip();
    if (!zip) {
        throw new Error('Electron 30.5.1 darwin-arm64 zip not found in cache. Run npm start once first.');
    }

    console.log('Using Electron zip:', zip);
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });

    const extractDir = path.join(projectRoot, '.packager-tmp', 'electron-extract');
    fs.rmSync(extractDir, { recursive: true, force: true });
    fs.mkdirSync(extractDir, { recursive: true });
    run('unzip', ['-q', zip, '-d', extractDir]);

    const electronApp = path.join(extractDir, 'Electron.app');
    if (!fs.existsSync(electronApp)) throw new Error('Electron.app missing after extract');

    run('ditto', [electronApp, appPath]);

    // Rename executable
    const macOSDir = path.join(appPath, 'Contents', 'MacOS');
    const electronBin = path.join(macOSDir, 'Electron');
    const menaceBin = path.join(macOSDir, 'Menace Agent');
    if (fs.existsSync(electronBin)) {
        fs.renameSync(electronBin, menaceBin);
    }

    // Resources: asar + helpers + icon
    const resourcesDir = path.join(appPath, 'Contents', 'Resources');
    const appAsar = path.join(resourcesDir, 'app.asar');
    const staging = path.join(projectRoot, '.packager-tmp', 'app-staging');
    fs.rmSync(staging, { recursive: true, force: true });
    fs.mkdirSync(staging, { recursive: true });

    // Copy package contents similar to electron-packager defaults
    const copyEntries = ['package.json', 'src', 'entitlements.plist', 'node_modules'];
    for (const entry of copyEntries) {
        const from = path.join(projectRoot, entry);
        const to = path.join(staging, entry);
        if (!fs.existsSync(from)) continue;
        console.log('Copying', entry, '...');
        run('ditto', [from, to]);
    }

    // Drop heavy/dev-only trees from the staged node_modules when present.
    for (const drop of [
        'node_modules/@electron-forge',
        'node_modules/electron',
        'node_modules/electron-winstaller',
        'node_modules/@electron/packager',
        'node_modules/@electron/rebuild',
        'node_modules/@electron/osx-sign',
        'node_modules/@electron/fuses',
        'node_modules/@reforged',
    ]) {
        fs.rmSync(path.join(staging, drop), { recursive: true, force: true });
    }

    // Point main correctly — package.json already has main: src/index.js
    const asarBin = path.join(projectRoot, 'node_modules/@electron/asar/bin/asar.js');
    if (fs.existsSync(asarBin)) {
        run(process.execPath, [asarBin, 'pack', staging, appAsar]);
    } else {
        // Fallback: unpacked app
        run('ditto', [staging, path.join(resourcesDir, 'app')]);
    }

    // Extra resources
    for (const rel of ['src/assets/SystemAudioDump', 'src/assets/CheatingDaddyAudio.app']) {
        const from = path.join(projectRoot, rel);
        if (fs.existsSync(from)) {
            run('ditto', [from, path.join(resourcesDir, path.basename(from))]);
        }
    }

    // Icon
    const icns = path.join(projectRoot, 'src/assets/logo.icns');
    if (fs.existsSync(icns)) {
        fs.copyFileSync(icns, path.join(resourcesDir, 'electron.icns'));
    }

    copyHelper(appPath);

    const { writePublicRuntimeConfig } = require(path.join(projectRoot, 'scripts/build-public-runtime-config'));
    writePublicRuntimeConfig(resourcesDir);

    // Info.plist
    const plistPath = path.join(appPath, 'Contents', 'Info.plist');
    const replacements = {
        CFBundleDisplayName: 'Menace Agent',
        CFBundleName: 'Menace Agent',
        CFBundleIdentifier: 'com.menaceagent.app',
        CFBundleExecutable: 'Menace Agent',
        CFBundleShortVersionString: require(path.join(projectRoot, 'package.json')).version,
        NSAudioCaptureUsageDescription:
            'Menace Agent needs system audio access to hear other participants in the conversation from your computer speakers or headset.',
        NSScreenCaptureDescription: 'Menace Agent needs screen capture for contextual live conversation assistance.',
        NSMicrophoneUsageDescription: 'Menace Agent needs microphone access when mic mode is enabled.',
        ElectronTeamID: '2NHJGX6A7S',
    };

    for (const [key, value] of Object.entries(replacements)) {
        try {
            execFileSync('plutil', ['-replace', key, '-string', value, plistPath], { stdio: 'ignore' });
        } catch {
            try {
                execFileSync('plutil', ['-insert', key, '-string', value, plistPath], { stdio: 'ignore' });
            } catch (error) {
                console.warn(`Unable to set ${key}:`, error.message);
            }
        }
    }
    execFileSync('plutil', ['-replace', 'LSApplicationCategoryType', '-string', 'public.app-category.productivity', plistPath], {
        stdio: 'ignore',
    });

    // Sign if identity available
    const identity = 'Developer ID Application: ANDREW DOUGLAS SEPECZI (2NHJGX6A7S)';
    const entitlements = path.join(projectRoot, 'entitlements.plist');
    try {
        run('codesign', [
            '--force',
            '--deep',
            '--options',
            'runtime',
            '--entitlements',
            entitlements,
            '--sign',
            identity,
            appPath,
        ]);
        run('codesign', ['--verify', '--deep', '--strict', appPath]);
        console.log('Signed with', identity);
    } catch (error) {
        console.warn('Signing skipped or failed:', error.message);
        console.warn('The app is still packaged unsigned at:', appPath);
    }

    console.log('Packaged:', appPath);
}

main();
