'use strict';

const storage = require('../storage');

let licensedHostedAccess = false;

function setLicensedHostedAccess(enabled) {
    licensedHostedAccess = Boolean(enabled);
}

function syncLicensedHostedAccess(licenseStatus) {
    if (!licenseStatus) {
        setLicensedHostedAccess(false);
        return;
    }

    setLicensedHostedAccess(Boolean(licenseStatus.valid || licenseStatus.skipped));
}

function getHostedOpenRouterApiKey() {
    const key = process.env.OPENROUTER_API_KEY || process.env.MENACE_OPENROUTER_API_KEY || '';
    return typeof key === 'string' ? key.trim() : '';
}

function isHostedOpenRouterConfigured() {
    return getHostedOpenRouterApiKey().length > 0;
}

function getUserOpenRouterApiKey() {
    const key = storage.getOpenRouterApiKey();
    return key && key.trim() ? key.trim() : '';
}

function getEffectiveOpenRouterApiKey() {
    const userKey = getUserOpenRouterApiKey();
    if (userKey) {
        return userKey;
    }

    if (licensedHostedAccess && isHostedOpenRouterConfigured()) {
        return getHostedOpenRouterApiKey();
    }

    return '';
}

function getOpenRouterAccess() {
    const userKey = getUserOpenRouterApiKey();
    if (userKey) {
        return { available: true, source: 'user', hostedConfigured: isHostedOpenRouterConfigured() };
    }

    if (licensedHostedAccess && isHostedOpenRouterConfigured()) {
        return { available: true, source: 'hosted', hostedConfigured: true };
    }

    return {
        available: false,
        source: 'none',
        hostedConfigured: isHostedOpenRouterConfigured(),
    };
}

module.exports = {
    setLicensedHostedAccess,
    syncLicensedHostedAccess,
    getHostedOpenRouterApiKey,
    isHostedOpenRouterConfigured,
    getUserOpenRouterApiKey,
    getEffectiveOpenRouterApiKey,
    getOpenRouterAccess,
};
