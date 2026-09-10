'use strict';

/**
 * Menace-owned update and release endpoints.
 *
 * Set via environment at build/packaging time when a production channel exists:
 *   MENACE_UPDATE_MANIFEST_URL  — JSON manifest with a `version` field (e.g. package.json)
 *   MENACE_RELEASE_PAGE_URL     — human-facing download / release page opened by "Update available"
 *
 * When unset, update checks fail silently and the update action does nothing.
 */

function trimOrNull(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function getUpdateSource() {
    return {
        versionManifestUrl: trimOrNull(process.env.MENACE_UPDATE_MANIFEST_URL),
        releasePageUrl: trimOrNull(process.env.MENACE_RELEASE_PAGE_URL),
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
