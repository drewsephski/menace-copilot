'use strict';

/**
 * Server-authoritative hosted-AI entitlement rules.
 * Benefit IDs are written by scripts/sync-polar-production.js --write.
 * Never trust client-supplied plan names or SKUs for hosted access.
 */

const HOSTED_AI_SKUS = new Set(['search_pass', 'monthly']);

function normalizeBenefitCatalog(raw) {
    if (!raw || typeof raw !== 'object') {
        return { byId: {}, bySku: {} };
    }

    const byId = {};
    const bySku = {};

    for (const [sku, entry] of Object.entries(raw)) {
        if (!entry || typeof entry !== 'object') {
            continue;
        }

        const benefitId = typeof entry.id === 'string' ? entry.id.trim() : '';
        const hostedAi = Boolean(entry.hostedAi);
        const record = { sku, hostedAi, label: entry.label || '' };

        bySku[sku] = record;
        if (benefitId) {
            byId[benefitId] = record;
        }
    }

    return { byId, bySku };
}

function resolveBenefitFromLicense(license, catalog) {
    if (!license || typeof license !== 'object') {
        return null;
    }

    const benefitId = typeof license.benefit_id === 'string' ? license.benefit_id.trim() : '';
    if (benefitId && catalog.byId[benefitId]) {
        return catalog.byId[benefitId];
    }

    const benefitLabel =
        typeof license.benefit?.description === 'string'
            ? license.benefit.description.trim()
            : typeof license.benefit_description === 'string'
              ? license.benefit_description.trim()
              : '';

    if (benefitLabel) {
        for (const record of Object.values(catalog.bySku)) {
            if (record.label === benefitLabel) {
                return record;
            }
        }
    }

    return null;
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

function resolveHostedAiEntitlement({ license, catalog, skipped = false, valid = false }) {
    if (skipped) {
        return {
            includedAi: true,
            planSku: 'dev_skip',
            benefitId: null,
            reason: 'dev_skip',
        };
    }

    if (!valid || !isLicenseCurrentlyValid(license)) {
        return {
            includedAi: false,
            planSku: null,
            benefitId: null,
            reason: 'license_invalid',
        };
    }

    const benefit = resolveBenefitFromLicense(license, catalog);
    if (!benefit) {
        return {
            includedAi: false,
            planSku: null,
            benefitId: license?.benefit_id || null,
            reason: 'unknown_benefit',
        };
    }

    const includedAi = Boolean(benefit.hostedAi && HOSTED_AI_SKUS.has(benefit.sku));
    return {
        includedAi,
        planSku: benefit.sku,
        benefitId: license?.benefit_id || null,
        reason: includedAi ? 'entitled' : 'byok_plan',
    };
}

module.exports = {
    HOSTED_AI_SKUS,
    normalizeBenefitCatalog,
    resolveBenefitFromLicense,
    isLicenseCurrentlyValid,
    resolveHostedAiEntitlement,
};
