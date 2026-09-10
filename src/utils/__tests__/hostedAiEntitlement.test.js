const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const {
    normalizeBenefitCatalog,
    resolveHostedAiEntitlement,
    isLicenseCurrentlyValid,
} = require('../../config/hostedAiEntitlement');

const CATALOG = normalizeBenefitCatalog({
    search_pass: {
        id: 'benefit-search-pass',
        label: 'Menace overlay license (90-day)',
        hostedAi: true,
    },
    monthly: {
        id: 'benefit-monthly',
        label: 'Menace overlay license (monthly)',
        hostedAi: true,
    },
    byok_monthly: {
        id: 'benefit-byok',
        label: 'Menace BYOK license (monthly)',
        hostedAi: false,
    },
});

function grantedLicense(benefitId, expiresAt = null) {
    return {
        status: 'granted',
        benefit_id: benefitId,
        expires_at: expiresAt,
    };
}

describe('hosted AI entitlement', () => {
    test('90-Day Pass benefit allows hosted AI', () => {
        const result = resolveHostedAiEntitlement({
            valid: true,
            license: grantedLicense('benefit-search-pass'),
            catalog: CATALOG,
        });
        assert.equal(result.includedAi, true);
        assert.equal(result.planSku, 'search_pass');
    });

    test('Monthly benefit allows hosted AI', () => {
        const result = resolveHostedAiEntitlement({
            valid: true,
            license: grantedLicense('benefit-monthly'),
            catalog: CATALOG,
        });
        assert.equal(result.includedAi, true);
        assert.equal(result.planSku, 'monthly');
    });

    test('BYOK benefit denies hosted AI', () => {
        const result = resolveHostedAiEntitlement({
            valid: true,
            license: grantedLicense('benefit-byok'),
            catalog: CATALOG,
        });
        assert.equal(result.includedAi, false);
        assert.equal(result.planSku, 'byok_monthly');
        assert.equal(result.reason, 'byok_plan');
    });

    test('expired license denies hosted AI', () => {
        const result = resolveHostedAiEntitlement({
            valid: true,
            license: grantedLicense('benefit-monthly', '2020-01-01T00:00:00.000Z'),
            catalog: CATALOG,
        });
        assert.equal(result.includedAi, false);
        assert.equal(result.reason, 'license_invalid');
    });

    test('invalid or unknown benefit denies hosted AI', () => {
        const unknown = resolveHostedAiEntitlement({
            valid: true,
            license: grantedLicense('benefit-unknown'),
            catalog: CATALOG,
        });
        assert.equal(unknown.includedAi, false);
        assert.equal(unknown.reason, 'unknown_benefit');

        const revoked = resolveHostedAiEntitlement({
            valid: false,
            license: { status: 'revoked', benefit_id: 'benefit-monthly' },
            catalog: CATALOG,
        });
        assert.equal(revoked.includedAi, false);
        assert.equal(revoked.reason, 'license_invalid');
    });

    test('isLicenseCurrentlyValid respects expiry', () => {
        assert.equal(isLicenseCurrentlyValid(grantedLicense('benefit-monthly')), true);
        assert.equal(isLicenseCurrentlyValid(grantedLicense('benefit-monthly', '2099-01-01T00:00:00.000Z')), true);
        assert.equal(isLicenseCurrentlyValid(grantedLicense('benefit-monthly', '2020-01-01T00:00:00.000Z')), false);
        assert.equal(isLicenseCurrentlyValid({ status: 'revoked' }), false);
    });
});
