const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const fs = require('fs');
const path = require('path');

function embedHostedEnv(buildPath) {
    require('./src/utils/loadEnv').loadEnv();
    const key = process.env.OPENROUTER_API_KEY || process.env.MENACE_OPENROUTER_API_KEY || '';
    if (!key.trim()) {
        return;
    }

    const resourcesPath = path.join(buildPath, 'Contents', 'Resources');
    fs.mkdirSync(resourcesPath, { recursive: true });
    fs.writeFileSync(path.join(resourcesPath, 'menace-hosted.env'), `OPENROUTER_API_KEY=${key.trim()}\n`, 'utf8');
}

function installMacAudioHelper(buildPath) {
    const helpersDir = path.join(buildPath, 'Contents', 'Helpers');
    fs.mkdirSync(helpersDir, { recursive: true });

    const sourceCandidates = [
        path.join(__dirname, 'src/assets/CheatingDaddyAudio.app/Contents/MacOS/CheatingDaddyAudio'),
        path.join(__dirname, 'src/assets/CheatingDaddyAudio.app/Contents/MacOS/SystemAudioDump'),
        path.join(__dirname, 'src/assets/SystemAudioDump'),
    ];
    const source = sourceCandidates.find(candidate => fs.existsSync(candidate));
    if (!source) {
        throw new Error('SystemAudioDump helper binary not found');
    }

    const target = path.join(helpersDir, 'SystemAudioDump');
    fs.copyFileSync(source, target);
    fs.chmodSync(target, 0o755);
}

module.exports = {
    packagerConfig: {
        asar: true,
        extraResource: ['./src/assets/SystemAudioDump', './src/assets/CheatingDaddyAudio.app'],
        name: 'Menace Agent',
        executableName: 'Menace Agent',
        appBundleId: 'com.menaceagent.app',
        appCategoryType: 'public.app-category.productivity',
        icon: 'src/assets/logo',
        // Required for system/loopback audio on macOS 14.2+ / 26+
        extendInfo: {
            NSAudioCaptureUsageDescription:
                'Menace Agent needs system audio access to hear the interviewer from your computer speakers or headset.',
            NSScreenCaptureDescription:
                'Menace Agent needs screen capture for contextual interview assistance.',
            NSMicrophoneUsageDescription: 'Menace Agent needs microphone access when mic mode is enabled.',
            ElectronTeamID: '2NHJGX6A7S',
            CFBundleDisplayName: 'Menace Agent',
            CFBundleName: 'Menace Agent',
        },
        osxSign: {
            identity: 'Developer ID Application: ANDREW DOUGLAS SEPECZI (2NHJGX6A7S)',
            optionsForFile: () => ({
                entitlements: 'entitlements.plist',
                'entitlements-inherit': 'entitlements.plist',
                hardenedRuntime: true,
                'signature-flags': 'library',
            }),
        },
        // Put SystemAudioDump inside Contents/Helpers so TCC attributes capture to the app.
        afterCopy: [
            (buildPath, electronVersion, platform, arch, callback) => {
                try {
                    if (platform === 'darwin') {
                        installMacAudioHelper(buildPath);
                        embedHostedEnv(buildPath);
                    }
                    callback();
                } catch (error) {
                    callback(error);
                }
            },
        ],
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
        },
        {
            name: '@electron-forge/maker-dmg',
            platforms: ['darwin'],
            config: {
                name: 'Menace Agent',
                format: 'ULFO',
            },
        },
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                name: 'menace-agent',
                productName: 'Menace Agent',
                shortcutName: 'Menace Agent',
                createDesktopShortcut: true,
                createStartMenuShortcut: true,
            },
        },
        {
            name: '@reforged/maker-appimage',
            platforms: ['linux'],
            config: {
                options: {
                    name: 'Menace Agent',
                    productName: 'Menace Agent',
                    genericName: 'AI Assistant',
                    description: 'Live interview autocue with OpenRouter and local Whisper',
                    categories: ['Productivity', 'Education'],
                    icon: 'src/assets/logo.png',
                },
            },
        },
    ],
    plugins: [
        {
            name: '@electron-forge/plugin-auto-unpack-natives',
            config: {},
        },
        new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
        }),
    ],
};
