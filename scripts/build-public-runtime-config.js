'use strict';

const fs = require('fs');
const path = require('path');
const { DEFAULT_HOSTED_API_BASE_URL } = require('../src/config/publicRuntimeConfig');

const SECRET_PATTERNS = [
    /(?:OPENROUTER_API_KEY|MENACE_OPENROUTER_API_KEY|GEMINI_API_KEY|POLAR_ACCESS_TOKEN)\s*=\s*['"]?[A-Za-z0-9._-]{8,}/i,
    /sk-or-v1-[A-Za-z0-9]{16,}/,
    /sk-[A-Za-z0-9]{20,}/,
    /AIza[0-9A-Za-z_-]{20,}/,
    /polar_pat_[A-Za-z0-9]{16,}/i,
    /Bearer\s+[A-Za-z0-9._-]{24,}/,
];

function buildPublicRuntimeConfigFromEnv() {
    require(path.join(__dirname, '..', 'src/utils/loadEnv')).loadEnv();

    return {
        updateManifestUrl: process.env.MENACE_UPDATE_MANIFEST_URL?.trim() || null,
        releasePageUrl: process.env.MENACE_RELEASE_PAGE_URL?.trim() || null,
        localAiBinariesBaseUrl: process.env.MENACE_LOCAL_AI_BINARIES_BASE_URL?.trim() || null,
        hostedApiBaseUrl: process.env.MENACE_HOSTED_API_BASE_URL?.trim() || DEFAULT_HOSTED_API_BASE_URL,
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
