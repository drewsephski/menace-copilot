const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const fs = require('fs');
const path = require('path');
const { writePublicRuntimeConfig } = require('./scripts/build-public-runtime-config');

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
                'Menace Agent needs system audio access to hear other participants in the conversation from your computer speakers or headset.',
            NSScreenCaptureDescription:
                'Menace Agent needs screen capture for contextual live conversation assistance.',
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
        osxNotarize:
            process.env.APPLE_ID && process.env.APPLE_APP_SPECIFIC_PASSWORD
                ? {
                      appleId: process.env.APPLE_ID,
                      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
                      teamId: process.env.APPLE_TEAM_ID || '2NHJGX6A7S',
                  }
                : undefined,
        // Put SystemAudioDump inside Contents/Helpers so TCC attributes capture to the app.
        afterCopy: [
            (buildPath, electronVersion, platform, arch, callback) => {
                try {
                    const resourcesPath =
                        platform === 'darwin'
                            ? path.join(buildPath, 'Contents', 'Resources')
                            : path.join(buildPath, 'resources');
                    writePublicRuntimeConfig(resourcesPath);
                    if (platform === 'darwin') {
                        installMacAudioHelper(buildPath);
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
                    description: 'Menace Agent — real-time conversation copilot with local Whisper and included or BYOK AI',
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
