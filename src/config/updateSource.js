'use strict';

const { getUpdateManifestUrl, getReleasePageUrl } = require('./publicRuntimeConfig');

/**
 * Menace-owned update and release endpoints.
 *
 * Values are loaded from menace-runtime-config.json at packaging time, with env overrides for development.
 * When unset, update checks fail silently and the update action does nothing.
 */

function getUpdateSource() {
    return {
        versionManifestUrl: getUpdateManifestUrl(),
        releasePageUrl: getReleasePageUrl(),
    };
}

function isUpdateSourceConfigured() {
    const { versionManifestUrl, releasePageUrl } = getUpdateSource();
    return Boolean(versionManifestUrl || releasePageUrl);
}

module.exports = {
    getUpdateSource,
    isUpdateSourceConfigured,
};
