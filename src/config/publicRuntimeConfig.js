'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_FILENAME = 'menace-runtime-config.json';

/** Production Menace gateway (Vercel serverless). Override via env or menace-runtime-config.json. */
const DEFAULT_HOSTED_API_BASE_URL = 'https://menace-agent.vercel.app/api';

let cachedConfig = null;

function trimOrNull(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function loadConfigFile() {
    const candidates = [];

    if (process.resourcesPath) {
        candidates.push(path.join(process.resourcesPath, CONFIG_FILENAME));
    }

    candidates.push(path.join(__dirname, '..', '..', CONFIG_FILENAME));
    candidates.push(path.join(process.cwd(), CONFIG_FILENAME));

    for (const candidate of candidates) {
        if (!fs.existsSync(candidate)) {
            continue;
        }

        try {
            const raw = JSON.parse(fs.readFileSync(candidate, 'utf8'));
            if (raw && typeof raw === 'object') {
                return raw;
            }
        } catch (error) {
            console.warn(`Could not read ${candidate}:`, error.message);
        }
    }

    return {};
}

function getPublicRuntimeConfig() {
    if (cachedConfig) {
        return cachedConfig;
    }

    const file = loadConfigFile();

    cachedConfig = {
        updateManifestUrl: trimOrNull(process.env.MENACE_UPDATE_MANIFEST_URL) ?? trimOrNull(file.updateManifestUrl),
        releasePageUrl: trimOrNull(process.env.MENACE_RELEASE_PAGE_URL) ?? trimOrNull(file.releasePageUrl),
        localAiBinariesBaseUrl:
            trimOrNull(process.env.MENACE_LOCAL_AI_BINARIES_BASE_URL) ?? trimOrNull(file.localAiBinariesBaseUrl),
        hostedApiBaseUrl:
            trimOrNull(process.env.MENACE_HOSTED_API_BASE_URL) ??
            trimOrNull(file.hostedApiBaseUrl) ??
            DEFAULT_HOSTED_API_BASE_URL,
    };

    return cachedConfig;
}

function resetPublicRuntimeConfigCache() {
    cachedConfig = null;
}

function isHostedGatewayConfigured() {
    return Boolean(getPublicRuntimeConfig().hostedApiBaseUrl);
}

module.exports = {
    CONFIG_FILENAME,
    DEFAULT_HOSTED_API_BASE_URL,
    getPublicRuntimeConfig,
    resetPublicRuntimeConfigCache,
    isHostedGatewayConfigured,
    getUpdateManifestUrl: () => getPublicRuntimeConfig().updateManifestUrl,
    getReleasePageUrl: () => getPublicRuntimeConfig().releasePageUrl,
    getLocalAiBinariesBaseUrl: () => getPublicRuntimeConfig().localAiBinariesBaseUrl,
    getHostedApiBaseUrl: () => getPublicRuntimeConfig().hostedApiBaseUrl,
};
