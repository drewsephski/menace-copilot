'use strict';

const os = require('os');
const { app } = require('electron');
const storage = require('../storage');
const { POLAR_CONFIG, getPolarApiOrigin, isAllowedPolarUrl } = require('./polarConfig');
const { syncLicensedHostedAccess, getOpenRouterAccess, isHostedOpenRouterConfigured } = require('./openrouterCredentials');

const LICENSE_KEY_MAX_LENGTH = 128;
const STALE_GRACE_MS = 72 * 60 * 60 * 1000;
const CHECKOUT_SKUS = new Set(['monthly', 'search_pass', 'byok_monthly']);

function shouldSkipLicense() {
    if (!process.env.MENACE_SKIP_LICENSE) {
        return false;
    }

    try {
        return !app.isPackaged;
    } catch {
        return true;
    }
}

function sanitizeLicenseKey(raw) {
    if (typeof raw !== 'string') {
        return '';
    }

    const key = raw.trim().replace(/\s+/g, '');
    if (key.length < 8 || key.length > LICENSE_KEY_MAX_LENGTH) {
        return '';
    }

    if (!/^[A-Za-z0-9_-]+$/.test(key)) {
        return '';
    }

    return key;
}

function sanitizeSku(raw) {
    if (typeof raw !== 'string') {
        return '';
    }

    const sku = raw.trim().toLowerCase();
    return CHECKOUT_SKUS.has(sku) ? sku : '';
}

function maskLicenseKey(key) {
    if (!key || key.length < 8) {
        return null;
    }

    return `${key.slice(0, 8)}…${key.slice(-4)}`;
}

function deviceLabel() {
    const host = String(os.hostname() || 'Menace Agent').slice(0, 60);
    const platform = os.platform();
    return `${host} (${platform})`.slice(0, 80);
}

function withHostedAiStatus(status) {
    const access = getOpenRouterAccess();
    return {
        ...status,
        hostedAi: access.source === 'hosted',
        hostedAiConfigured: isHostedOpenRouterConfigured(),
        openRouterSource: access.source,
    };
}

function publicStatus(extra = {}) {
    const stored = storage.getLicense();
    const status = {
        valid: false,
        skipped: false,
        stale: false,
        sandbox: POLAR_CONFIG.server === 'sandbox',
        status: 'missing',
        displayKey: maskLicenseKey(stored.key),
        expiresAt: extra.expiresAt || null,
        error: extra.error || null,
        ...extra,
    };
    syncLicensedHostedAccess(status);
    return withHostedAiStatus(status);
}

async function polarRequest(pathname, body) {
    const response = await fetch(`${getPolarApiOrigin()}${pathname}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    let payload = null;
    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    return { ok: response.ok, status: response.status, payload };
}

function licenseFromActivation(payload) {
    return payload && payload.license_key ? payload.license_key : payload;
}

function isLicenseCurrentlyValid(license) {
    if (!license || license.status !== 'granted') {
        return false;
    }

    if (license.expires_at) {
        const expiresAt = Date.parse(license.expires_at);
        if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
            return false;
        }
    }

    return true;
}

function messageForLicense(license, fallback) {
    if (!license) {
        return fallback;
    }

    if (license.status === 'revoked') {
        return 'This license was cancelled.';
    }

    if (license.status === 'disabled') {
        return 'This license is disabled.';
    }

    if (license.expires_at && Date.parse(license.expires_at) <= Date.now()) {
        return 'This license has expired.';
    }

    return fallback;
}

function polarErrorDetail(payload) {
    if (!payload) {
        return '';
    }

    const detail = payload.detail || payload.error;
    return typeof detail === 'string' ? detail : '';
}

function successFromLicense(key, activationId, license) {
    storage.setLicense({
        key,
        activationId: activationId || '',
        validatedAt: Date.now(),
    });

    return {
        success: true,
        status: publicStatus({
            valid: true,
            status: license.status,
            expiresAt: license.expires_at || null,
            displayKey: maskLicenseKey(key),
            error: null,
        }),
    };
}

async function validateLicenseKey(key, activationId = '') {
    const body = {
        key,
        organization_id: POLAR_CONFIG.organizationId,
    };

    if (activationId) {
        body.activation_id = activationId;
    }

    return polarRequest('/v1/customer-portal/license-keys/validate', body);
}

async function activateKey(key) {
    // Most Polar license keys validate directly — device activation is optional.
    const validated = await validateLicenseKey(key);
    if (validated.ok) {
        const license = licenseFromActivation(validated.payload);
        if (isLicenseCurrentlyValid(license)) {
            return successFromLicense(key, '', license);
        }

        return { success: false, error: messageForLicense(license, 'This license is not active.') };
    }

    const { ok, status, payload } = await polarRequest('/v1/customer-portal/license-keys/activate', {
        key,
        organization_id: POLAR_CONFIG.organizationId,
        label: deviceLabel(),
        meta: {
            app: 'menace-agent',
            platform: os.platform(),
        },
    });

    if (!ok) {
        const detail = polarErrorDetail(payload);
        const message =
            status === 403 && detail.includes('does not support activations')
                ? 'This license could not be validated. Check the key and try again.'
                : status === 403
                  ? 'This key is already used on too many devices. Deactivate one from Polar, then try again.'
                  : status === 404
                    ? 'That license key was not found.'
                    : detail || 'Could not activate that license key.';

        return { success: false, error: message };
    }

    const license = licenseFromActivation(payload);
    if (!isLicenseCurrentlyValid(license)) {
        return { success: false, error: messageForLicense(license, 'This license is not active.') };
    }

    const activationId = payload && typeof payload.id === 'string' ? payload.id : '';
    return successFromLicense(key, activationId, license);
}

async function validateStoredLicense() {
    if (shouldSkipLicense()) {
        return publicStatus({
            valid: true,
            skipped: true,
            status: 'granted',
            error: null,
        });
    }

    const stored = storage.getLicense();
    if (!stored.key) {
        return publicStatus({ status: 'missing' });
    }

    const body = {
        key: stored.key,
        organization_id: POLAR_CONFIG.organizationId,
    };

    if (stored.activationId) {
        body.activation_id = stored.activationId;
    }

    let result;
    try {
        result = await polarRequest('/v1/customer-portal/license-keys/validate', body);
    } catch (error) {
        const stale = stored.validatedAt && Date.now() - stored.validatedAt < STALE_GRACE_MS;
        return publicStatus({
            valid: stale,
            stale,
            status: stale ? 'granted' : 'offline',
            error: stale ? null : 'Could not reach Polar to check this license.',
        });
    }

    if (!result.ok) {
        if (result.status === 404 && stored.activationId) {
            storage.setLicense({ activationId: '', validatedAt: 0 });
            const retry = await activateKey(stored.key);
            if (retry.success) {
                return retry.status;
            }
        }

        const stale = stored.validatedAt && Date.now() - stored.validatedAt < STALE_GRACE_MS && result.status >= 500;
        return publicStatus({
            valid: stale,
            stale,
            status: result.status === 404 ? 'missing' : 'error',
            error: stale ? null : 'This license could not be validated.',
        });
    }

    const license = licenseFromActivation(result.payload);
    if (!isLicenseCurrentlyValid(license)) {
        const expired = Boolean(license && license.expires_at && Date.parse(license.expires_at) <= Date.now());
        return publicStatus({
            status: expired ? 'expired' : license && license.status ? license.status : 'error',
            expiresAt: license && license.expires_at ? license.expires_at : null,
            error: messageForLicense(license, 'This license is not active.'),
        });
    }

    storage.setLicense({
        key: stored.key,
        activationId: stored.activationId,
        validatedAt: Date.now(),
    });

    return publicStatus({
        valid: true,
        status: license.status,
        expiresAt: license.expires_at || null,
        displayKey: maskLicenseKey(stored.key),
        error: null,
    });
}

async function activateLicense(rawKey) {
    if (shouldSkipLicense()) {
        return { success: true, status: await validateStoredLicense() };
    }

    const key = sanitizeLicenseKey(rawKey);
    if (!key) {
        return { success: false, error: 'Enter a valid license key.' };
    }

    storage.setLicense({ key, activationId: '', validatedAt: 0 });
    return activateKey(key);
}

async function getLicenseStatus() {
    try {
        return await validateStoredLicense();
    } catch (error) {
        return publicStatus({
            status: 'error',
            error: error.message || 'Could not check this license.',
        });
    }
}

function clearLicense() {
    storage.clearLicense();
    syncLicensedHostedAccess({ valid: false, skipped: false });
    return publicStatus({ status: 'missing' });
}

function getCustomerPortalUrl() {
    const slug = process.env.POLAR_ORG_SLUG || 'menace';
    return `https://polar.sh/${slug}/portal`;
}

function getCheckoutUrl(rawSku) {
    const sku = sanitizeSku(rawSku);
    if (!sku) {
        return { success: false, error: 'Unknown plan.' };
    }

    if (!POLAR_CONFIG.organizationId) {
        return {
            success: false,
            error: 'Polar is not configured yet. Run npm run polar:sync after setting POLAR_ACCESS_TOKEN in .env.',
        };
    }

    const url = POLAR_CONFIG.checkout[sku];
    if (!url || url.includes('REPLACE_') || !isAllowedPolarUrl(url)) {
        return {
            success: false,
            error: 'Checkout is not configured for this plan. Run npm run polar:sync.',
        };
    }

    return { success: true, url };
}

async function requireActiveLicense() {
    const status = await getLicenseStatus();
    if (status.valid) {
        return { ok: true, status };
    }

    return {
        ok: false,
        error: 'An active Menace Agent pass is required. Unlock in the app to continue.',
        status,
    };
}

module.exports = {
    getLicenseStatus,
    activateLicense,
    clearLicense,
    getCheckoutUrl,
    getCustomerPortalUrl,
    shouldSkipLicense,
    requireActiveLicense,
};
