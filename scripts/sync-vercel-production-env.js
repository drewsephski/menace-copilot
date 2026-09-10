#!/usr/bin/env node
'use strict';

/**
 * Sync non-secret gateway env vars to Vercel production from checked-in public config.
 * Secrets (OPENROUTER_API_KEY, KV tokens) must already exist locally in .env.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

require(path.join(__dirname, '..', 'src', 'utils', 'loadEnv')).loadEnv();

const publicConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'config', 'polarProduction.public.json'), 'utf8'));

const siteDir = path.join(__dirname, '..', 'site');

function upsertEnv(name, value) {
    if (!value) {
        console.warn(`Skipping ${name}: no value`);
        return false;
    }

    const remove = spawnSync('vercel', ['env', 'rm', name, 'production', '--yes'], {
        cwd: siteDir,
        stdio: 'pipe',
        encoding: 'utf8',
    });

    if (remove.status !== 0 && !/Environment Variable was not found/i.test(remove.stderr || '')) {
        console.warn(`Could not remove existing ${name}:`, (remove.stderr || remove.stdout || '').trim());
    }

    const add = spawnSync('vercel', ['env', 'add', name, 'production', '--force'], {
        cwd: siteDir,
        input: value,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
    });

    if (add.status !== 0) {
        throw new Error(`Failed to set ${name}: ${(add.stderr || add.stdout || '').trim()}`);
    }

    console.log(`Set ${name} on Vercel production`);
    return true;
}

function main() {
    upsertEnv('POLAR_ORGANIZATION_ID', publicConfig.organizationId);
    upsertEnv('MENACE_POLAR_BENEFITS_JSON', JSON.stringify(publicConfig.benefits || {}));

    if (process.env.OPENROUTER_API_KEY) {
        upsertEnv('OPENROUTER_API_KEY', process.env.OPENROUTER_API_KEY);
    } else {
        console.warn('OPENROUTER_API_KEY missing locally; gateway upstream will stay unavailable');
    }

    for (const key of ['KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']) {
        if (process.env[key]) {
            upsertEnv(key, process.env[key]);
        }
    }

    console.log('Vercel production env sync complete');
}

main();
