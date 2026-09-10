'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Public Polar checkout config. These values are not secrets:
 * organization ID is required by Polar's customer-portal license API,
 * and checkout links are meant to be opened in a browser.
 *
 * Production values are written by:
 *   node scripts/sync-polar-production.js --write
 *
 * Never put a Polar access token in this file.
 */
function loadGeneratedConfig() {
    const generatedPath = path.join(__dirname, 'polarConfig.generated.json');
    if (!fs.existsSync(generatedPath)) {
        return null;
    }

    try {
        return JSON.parse(fs.readFileSync(generatedPath, 'utf8'));
    } catch (error) {
        console.warn('Could not read polarConfig.generated.json:', error.message);
        return null;
    }
}

const generated = loadGeneratedConfig();

const SERVER = process.env.POLAR_SERVER || generated?.server || 'production';

const POLAR_CONFIG = {
    server: SERVER,
    organizationId:
        process.env.POLAR_ORGANIZATION_ID ||
        generated?.organizationId ||
        (SERVER === 'sandbox' ? '5bc5f1d2-0e3c-40b3-a743-6b9596ada683' : ''),
    checkout: {
        monthly:
            process.env.POLAR_CHECKOUT_MONTHLY_URL ||
            generated?.checkout?.monthly ||
            'https://api.polar.sh/v1/checkout-links/polar_cl_REPLACE_MONTHLY/redirect',
        search_pass:
            process.env.POLAR_CHECKOUT_SEARCH_PASS_URL ||
            generated?.checkout?.search_pass ||
            'https://api.polar.sh/v1/checkout-links/polar_cl_REPLACE_SEARCH_PASS/redirect',
        byok_monthly:
            process.env.POLAR_CHECKOUT_BYOK_MONTHLY_URL ||
            generated?.checkout?.byok_monthly ||
            'https://api.polar.sh/v1/checkout-links/polar_cl_REPLACE_BYOK_MONTHLY/redirect',
    },
};

const POLAR_API_ORIGINS = {
    sandbox: 'https://sandbox-api.polar.sh',
    production: 'https://api.polar.sh',
};

const ALLOWED_CHECKOUT_HOSTS = new Set(['sandbox-api.polar.sh', 'sandbox.polar.sh', 'api.polar.sh', 'polar.sh', 'buy.polar.sh']);

function getPolarApiOrigin() {
    return POLAR_API_ORIGINS[POLAR_CONFIG.server] || POLAR_API_ORIGINS.production;
}

function isAllowedPolarUrl(rawUrl) {
    let parsed;
    try {
        parsed = new URL(rawUrl);
    } catch {
        return false;
    }

    return parsed.protocol === 'https:' && ALLOWED_CHECKOUT_HOSTS.has(parsed.hostname);
}

function validatePolarConfig() {
    const problems = [];

    if (POLAR_CONFIG.server === 'production') {
        if (POLAR_CONFIG.checkout.monthly.includes('REPLACE_MONTHLY')) {
            problems.push('monthly checkout URL is a placeholder — run node scripts/sync-polar-production.js --write');
        }
        if (POLAR_CONFIG.checkout.search_pass.includes('REPLACE_SEARCH_PASS')) {
            problems.push('search_pass checkout URL is a placeholder — run node scripts/sync-polar-production.js --write');
        }
        if (POLAR_CONFIG.checkout.byok_monthly.includes('REPLACE_BYOK_MONTHLY')) {
            problems.push('byok_monthly checkout URL is a placeholder — run node scripts/sync-polar-production.js --write');
        }
        if (POLAR_CONFIG.checkout.monthly.includes('sandbox-api.polar.sh')) {
            problems.push('monthly checkout still points at sandbox');
        }
        if (POLAR_CONFIG.checkout.search_pass.includes('sandbox-api.polar.sh')) {
            problems.push('search_pass checkout still points at sandbox');
        }
    }

    if (problems.length > 0) {
        console.warn('[Polar] Config warnings:\n - ' + problems.join('\n - '));
    }

    return problems;
}

validatePolarConfig();

module.exports = {
    POLAR_CONFIG,
    getPolarApiOrigin,
    isAllowedPolarUrl,
    validatePolarConfig,
};
