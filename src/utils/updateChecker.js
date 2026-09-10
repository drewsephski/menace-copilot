'use strict';

const { app } = require('electron');
const { getUpdateSource } = require('../config/updateSource');

function parseVersion(version) {
    if (typeof version !== 'string' || !version.trim()) {
        return null;
    }
    const parts = version.trim().split('.').map(part => {
        const n = Number(part);
        return Number.isFinite(n) ? n : 0;
    });
    return parts.length > 0 ? parts : null;
}

function isNewerVersion(remote, current) {
    const remoteParts = parseVersion(remote);
    const currentParts = parseVersion(current);
    if (!remoteParts || !currentParts) {
        return false;
    }

    const length = Math.max(remoteParts.length, currentParts.length);
    for (let i = 0; i < length; i++) {
        const r = remoteParts[i] || 0;
        const c = currentParts[i] || 0;
        if (r > c) {
            return true;
        }
        if (r < c) {
            return false;
        }
    }
    return false;
}

async function fetchRemoteVersion(manifestUrl) {
    const response = await fetch(manifestUrl, {
        headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`Update manifest HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!payload || typeof payload.version !== 'string') {
        throw new Error('Update manifest missing version field');
    }

    return payload.version.trim();
}

async function checkForUpdates() {
    const localVersion = app.getVersion();
    const { versionManifestUrl, releasePageUrl } = getUpdateSource();

    if (!versionManifestUrl) {
        return {
            updateAvailable: false,
            localVersion,
            remoteVersion: null,
            releasePageUrl: releasePageUrl || null,
        };
    }

    try {
        const remoteVersion = await fetchRemoteVersion(versionManifestUrl);
        return {
            updateAvailable: isNewerVersion(remoteVersion, localVersion),
            localVersion,
            remoteVersion,
            releasePageUrl: releasePageUrl || null,
        };
    } catch (error) {
        console.warn('Update check failed:', error.message);
        return {
            updateAvailable: false,
            localVersion,
            remoteVersion: null,
            releasePageUrl: releasePageUrl || null,
        };
    }
}

function getReleasePageUrl() {
    return getUpdateSource().releasePageUrl;
}

module.exports = {
    checkForUpdates,
    getReleasePageUrl,
    isNewerVersion,
};
