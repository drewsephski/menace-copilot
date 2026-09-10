'use strict';

/**
 * Menace-owned binary release base URL for local AI runtime downloads (llama-server, whisper-server).
 *
 * Set MENACE_LOCAL_AI_BINARIES_BASE_URL when publishing platform binaries, e.g.:
 *   https://github.com/<org>/menace-agent/releases/download/v1.0.0
 *
 * When unset, binaries are only used if already present on disk from a prior download.
 */

function getLocalAiBinariesBaseUrl() {
    const raw = process.env.MENACE_LOCAL_AI_BINARIES_BASE_URL;
    if (typeof raw !== 'string') {
        return null;
    }
    const trimmed = raw.trim().replace(/\/+$/, '');
    return trimmed.length > 0 ? trimmed : null;
}

module.exports = {
    getLocalAiBinariesBaseUrl,
};
