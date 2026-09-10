'use strict';

const storage = require('../storage');
const { isHostedGatewayConfigured } = require('../config/publicRuntimeConfig');

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

function getUserOpenRouterApiKey() {
    const key = storage.getOpenRouterApiKey();
    return key && key.trim() ? key.trim() : '';
}

function isHostedOpenRouterConfigured() {
    return isHostedGatewayConfigured();
}

function getHostedOpenRouterApiKey() {
    return '';
}

function getEffectiveOpenRouterApiKey() {
    return getUserOpenRouterApiKey();
}

function getOpenRouterAccess() {
    const userKey = getUserOpenRouterApiKey();
    if (userKey) {
        return { available: true, source: 'user', hostedConfigured: isHostedGatewayConfigured() };
    }

    if (licensedHostedAccess && isHostedGatewayConfigured()) {
        return { available: true, source: 'hosted', hostedConfigured: true };
    }

    return {
        available: false,
        source: licensedHostedAccess ? 'hosted-unconfigured' : 'none',
        hostedConfigured: isHostedGatewayConfigured(),
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
