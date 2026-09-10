'use strict';

const fs = require('fs');
const path = require('path');

const PUBLIC_CONFIG_PATH = path.join(__dirname, 'polarProduction.public.json');

function loadPolarProductionConfig() {
    if (!fs.existsSync(PUBLIC_CONFIG_PATH)) {
        return null;
    }

    try {
        return JSON.parse(fs.readFileSync(PUBLIC_CONFIG_PATH, 'utf8'));
    } catch (error) {
        console.warn('Could not read polarProduction.public.json:', error.message);
        return null;
    }
}

function assertProductionPolarConfig(config) {
    const problems = [];

    if (!config || typeof config !== 'object') {
        problems.push('polarProduction.public.json is missing or invalid');
        return problems;
    }

    if (!config.organizationId || typeof config.organizationId !== 'string') {
        problems.push('organizationId is missing');
    }

    const checkout = config.checkout || {};
    for (const sku of ['monthly', 'search_pass', 'byok_monthly']) {
        const url = checkout[sku];
        if (typeof url !== 'string' || url.length === 0) {
            problems.push(`${sku} checkout URL is missing`);
            continue;
        }
        if (url.includes('REPLACE_')) {
            problems.push(`${sku} checkout URL is still a placeholder`);
        }
        if (url.includes('sandbox-api.polar.sh')) {
            problems.push(`${sku} checkout URL still points at sandbox`);
        }
    }

    return problems;
}

module.exports = {
    PUBLIC_CONFIG_PATH,
    loadPolarProductionConfig,
    assertProductionPolarConfig,
};
