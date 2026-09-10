#!/usr/bin/env node
'use strict';

/**
 * Integration check for: valid license → hosted OpenRouter (no user API key).
 *
 * Usage:
 *   node scripts/test-hosted-license-flow.js
 *   node scripts/test-hosted-license-flow.js MENACE_your_key_here
 */

const path = require('path');

require(path.join(__dirname, '..', 'src', 'utils', 'loadEnv')).loadEnv();

const storage = require('../src/storage');
const polar = require('../src/utils/polar');
const {
    getOpenRouterAccess,
    getUserOpenRouterApiKey,
    syncLicensedHostedAccess,
    isHostedOpenRouterConfigured,
} = require('../src/utils/openrouterCredentials');
const { getEffectiveOpenRouterApiKey } = require('../src/utils/openrouterCredentials');

async function assertHostedPath(label, licenseStatus) {
    syncLicensedHostedAccess(licenseStatus);
    const userKey = getUserOpenRouterApiKey();
    const access = getOpenRouterAccess();
    const hasKey = Boolean(getEffectiveOpenRouterApiKey());

    console.log(`\n[${label}]`);
    console.log('  license.valid:', licenseStatus.valid);
    console.log('  user OpenRouter key:', userKey ? '(set)' : '(empty)');
    console.log('  hosted configured:', isHostedOpenRouterConfigured());
    console.log('  openrouter access:', access);
    console.log('  hasOpenRouterKey():', hasKey);

    if (!licenseStatus.valid) {
        throw new Error(`${label}: expected valid license`);
    }
    if (userKey) {
        throw new Error(`${label}: user OpenRouter key should be empty for hosted test`);
    }
    if (!isHostedOpenRouterConfigured()) {
        throw new Error(`${label}: OPENROUTER_API_KEY missing from .env`);
    }
    if (!access.available || access.source !== 'hosted') {
        throw new Error(`${label}: expected hosted OpenRouter access`);
    }
    if (!hasKey) {
        throw new Error(`${label}: effective OpenRouter key should be available with hosted AI`);
    }
}

async function main() {
    storage.initializeStorage();

    // Ensure BYOK key is not masking hosted path
    storage.setOpenRouterApiKey('');

    const keyFromArgv = process.argv[2];
    if (keyFromArgv) {
        console.log('Activating license from argument…');
        const activation = await polar.activateLicense(keyFromArgv);
        if (!activation.success) {
            throw new Error(activation.error || 'License activation failed');
        }
        await assertHostedPath('after activation', activation.status);
        console.log('\nPASS: license activation + hosted OpenRouter path works.');
        return;
    }

    if (process.env.MENACE_SKIP_LICENSE === '1') {
        await assertHostedPath('dev skip license', { valid: true, skipped: true });
        console.log('\nPASS: MENACE_SKIP_LICENSE hosted path works (dev only).');
        return;
    }

    const status = await polar.getLicenseStatus();
    if (status.valid) {
        await assertHostedPath('stored license', status);
        console.log('\nPASS: stored license + hosted OpenRouter path works.');
        return;
    }

    console.log('No valid license on this Mac.');
    console.log('Options:');
    console.log('  1) node scripts/test-hosted-license-flow.js MENACE_…');
    console.log('  2) MENACE_SKIP_LICENSE=1 node scripts/test-hosted-license-flow.js');
    process.exit(2);
}

main().catch(error => {
    console.error('\nFAIL:', error.message || error);
    process.exit(1);
});
