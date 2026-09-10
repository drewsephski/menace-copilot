'use strict';

const updateSource = require('../../src/config/updateSource');
const releaseSource = require('../../src/config/releaseSource');
const { isNewerVersion } = require('../../src/utils/updateChecker');

function main() {
    const source = updateSource.getUpdateSource();
    if (!source || typeof source !== 'object') {
        throw new Error('getUpdateSource must return an object');
    }

    if (!('versionManifestUrl' in source) || !('releasePageUrl' in source)) {
        throw new Error('Update source must expose versionManifestUrl and releasePageUrl');
    }

    if (typeof updateSource.isUpdateSourceConfigured !== 'function') {
        throw new Error('isUpdateSourceConfigured must be a function');
    }

    const binariesUrl = releaseSource.getLocalAiBinariesBaseUrl();
    if (binariesUrl !== null && typeof binariesUrl !== 'string') {
        throw new Error('getLocalAiBinariesBaseUrl must return null or string');
    }

    if (!isNewerVersion('1.0.1', '1.0.0')) {
        throw new Error('isNewerVersion should detect patch upgrades');
    }

    if (isNewerVersion('1.0.0', '1.0.0')) {
        throw new Error('isNewerVersion should not flag equal versions');
    }

    console.log('Update/release source configuration OK');
}

try {
    main();
} catch (error) {
    console.error('Update source check failed:', error.message);
    process.exit(1);
}
