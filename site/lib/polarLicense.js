'use strict';

const { getPolarApiOrigin, loadBenefitCatalog, getPolarOrganizationId } = require('./gatewayConfig');
const { resolveHostedAiEntitlement } = require('./hostedAiEntitlement');

function extractBearerToken(headerValue) {
    if (typeof headerValue !== 'string') {
        return '';
    }

    const match = headerValue.match(/^Bearer\s+(.+)$/i);
    return match ? match[1].trim() : '';
}

function licenseFromPayload(payload) {
    return payload && payload.license_key ? payload.license_key : payload;
}

async function validateLicenseKey(licenseKey) {
    const organizationId = getPolarOrganizationId();
    if (!organizationId) {
        throw new Error('POLAR_ORGANIZATION_ID is not configured');
    }

    const response = await fetch(`${getPolarApiOrigin()}/v1/customer-portal/license-keys/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            key: licenseKey,
            organization_id: organizationId,
        }),
    });

    let payload = null;
    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (!response.ok) {
        const detail = payload?.detail || payload?.error || 'License validation failed';
        const error = new Error(typeof detail === 'string' ? detail : 'License validation failed');
        error.status = response.status === 404 ? 401 : 403;
        throw error;
    }

    const license = licenseFromPayload(payload);
    const catalog = loadBenefitCatalog();
    const entitlement = resolveHostedAiEntitlement({
        license,
        catalog,
        valid: true,
        skipped: false,
    });

    if (!entitlement.includedAi) {
        const error = new Error('License is valid but does not include hosted AI');
        error.status = 403;
        throw error;
    }

    return { license, entitlement };
}

module.exports = {
    extractBearerToken,
    validateLicenseKey,
};
