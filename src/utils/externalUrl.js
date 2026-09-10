'use strict';

const { isAllowedPolarUrl } = require('./polarConfig');

const ALLOWED_PROTOCOLS = new Set(['https:', 'http:', 'mailto:', 'x-apple.systempreferences:']);

function isAllowedExternalUrl(rawUrl) {
    if (typeof rawUrl !== 'string' || rawUrl.length === 0 || rawUrl.length > 2048) {
        return false;
    }

    if (isAllowedPolarUrl(rawUrl)) {
        return true;
    }

    let parsed;
    try {
        parsed = new URL(rawUrl);
    } catch {
        return false;
    }

    return ALLOWED_PROTOCOLS.has(parsed.protocol);
}

module.exports = {
    isAllowedExternalUrl,
};
