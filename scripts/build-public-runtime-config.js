'use strict';

const fs = require('fs');
const path = require('path');

const SECRET_PATTERNS = [
    /OPENROUTER_API_KEY/i,
    /MENACE_OPENROUTER_API_KEY/i,
    /GEMINI_API_KEY/i,
    /POLAR_ACCESS_TOKEN/i,
    /sk-[A-Za-z0-9]{10,}/,
    /Bearer\s+[A-Za-z0-9._-]{10,}/,
];

function buildPublicRuntimeConfigFromEnv() {
    require(path.join(__dirname, '..', 'src/utils/loadEnv')).loadEnv();

    return {
        updateManifestUrl: process.env.MENACE_UPDATE_MANIFEST_URL?.trim() || null,
        releasePageUrl: process.env.MENACE_RELEASE_PAGE_URL?.trim() || null,
        localAiBinariesBaseUrl: process.env.MENACE_LOCAL_AI_BINARIES_BASE_URL?.trim() || null,
        hostedApiBaseUrl: process.env.MENACE_HOSTED_API_BASE_URL?.trim() || null,
    };
}

function assertNoSecretsInPublicConfig(config) {
    const serialized = JSON.stringify(config);

    for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(serialized)) {
            throw new Error('Public runtime config must not contain provider or server secrets');
        }
    }

    for (const value of Object.values(config)) {
        if (typeof value === 'string' && value.includes('menace-hosted.env')) {
            throw new Error('Public runtime config must not reference menace-hosted.env');
        }
    }
}

function writePublicRuntimeConfig(targetDir) {
    const config = buildPublicRuntimeConfigFromEnv();
    assertNoSecretsInPublicConfig(config);

    fs.mkdirSync(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, 'menace-runtime-config.json');
    fs.writeFileSync(targetPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
    return targetPath;
}

module.exports = {
    buildPublicRuntimeConfigFromEnv,
    assertNoSecretsInPublicConfig,
    writePublicRuntimeConfig,
    SECRET_PATTERNS,
};
