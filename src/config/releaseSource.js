'use strict';

const { getLocalAiBinariesBaseUrl } = require('./publicRuntimeConfig');

/**
 * Menace-owned binary release base URL for local AI runtime downloads (llama-server, whisper-server).
 *
 * Loaded from menace-runtime-config.json at packaging time, with env overrides for development.
 * When unset, binaries are only used if already present on disk from a prior download.
 */

module.exports = {
    getLocalAiBinariesBaseUrl,
};
