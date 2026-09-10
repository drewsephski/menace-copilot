'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { buildPublicRuntimeConfigFromEnv, assertNoSecretsInPublicConfig, writePublicRuntimeConfig } = require('../build-public-runtime-config');
const { resetPublicRuntimeConfigCache, getPublicRuntimeConfig } = require('../../src/config/publicRuntimeConfig');

function main() {
    const config = buildPublicRuntimeConfigFromEnv();
    assertNoSecretsInPublicConfig(config);

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'menace-runtime-config-'));
    const written = writePublicRuntimeConfig(tempDir);
    const parsed = JSON.parse(fs.readFileSync(written, 'utf8'));

    for (const key of ['updateManifestUrl', 'releasePageUrl', 'localAiBinariesBaseUrl', 'hostedApiBaseUrl']) {
        if (!(key in parsed)) {
            throw new Error(`menace-runtime-config.json missing ${key}`);
        }
    }

    process.env.MENACE_UPDATE_MANIFEST_URL = 'https://example.com/manifest.json';
    resetPublicRuntimeConfigCache();
    const loaded = getPublicRuntimeConfig();
    if (loaded.updateManifestUrl !== 'https://example.com/manifest.json') {
        throw new Error('Env override for public runtime config failed');
    }

    delete process.env.MENACE_UPDATE_MANIFEST_URL;
    resetPublicRuntimeConfigCache();

    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('Public runtime config check OK');
}

try {
    main();
} catch (error) {
    console.error('Public runtime config check failed:', error.message);
    process.exit(1);
}
