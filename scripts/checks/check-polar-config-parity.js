'use strict';

const fs = require('fs');
const path = require('path');

const CANONICAL_PATH = path.join(__dirname, '..', '..', 'src', 'config', 'polarProduction.public.json');
const SITE_PATH = path.join(__dirname, '..', '..', 'site', 'lib', 'polarProduction.public.json');

function normalizePublicPolarConfig(config) {
    return {
        server: config.server,
        organizationId: config.organizationId,
        checkout: config.checkout || {},
        benefits: config.benefits || {},
    };
}

function main() {
    if (!fs.existsSync(CANONICAL_PATH)) {
        throw new Error(`Missing canonical Polar config: ${CANONICAL_PATH}`);
    }
    if (!fs.existsSync(SITE_PATH)) {
        throw new Error(`Missing site Polar config: ${SITE_PATH}`);
    }

    const canonical = normalizePublicPolarConfig(JSON.parse(fs.readFileSync(CANONICAL_PATH, 'utf8')));
    const site = normalizePublicPolarConfig(JSON.parse(fs.readFileSync(SITE_PATH, 'utf8')));

    const canonicalJson = JSON.stringify(canonical);
    const siteJson = JSON.stringify(site);

    if (canonicalJson !== siteJson) {
        throw new Error('Polar public config drift detected between src/config and site/lib copies');
    }

    console.log('Polar public config parity check OK');
}

try {
    main();
} catch (error) {
    console.error('Polar public config parity check failed:', error.message);
    process.exit(1);
}
