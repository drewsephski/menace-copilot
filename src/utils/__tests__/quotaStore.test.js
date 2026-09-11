const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const quotaStore = require(path.join(__dirname, '..', '..', '..', 'site', 'lib', 'quotaStore'));

describe('quotaStore', () => {
    const originalFetch = global.fetch;
    const counters = new Map();

    beforeEach(() => {
        counters.clear();
        process.env.KV_REST_API_URL = 'https://example.upstash.io';
        process.env.KV_REST_API_TOKEN = 'test-token';

        global.fetch = async (_url, options) => {
            const command = JSON.parse(options.body);
            const [op, key, value] = command;

            if (op === 'INCR') {
                const next = (counters.get(key) || 0) + 1;
                counters.set(key, next);
                return { ok: true, json: async () => ({ result: next }) };
            }

            if (op === 'INCRBY') {
                const next = (counters.get(key) || 0) + Number(value);
                counters.set(key, next);
                return { ok: true, json: async () => ({ result: next }) };
            }

            if (op === 'EXPIRE' || op === 'TTL') {
                return { ok: true, json: async () => ({ result: 60 }) };
            }

            return { ok: true, json: async () => ({ result: null }) };
        };
    });

    afterEach(() => {
        global.fetch = originalFetch;
        delete process.env.KV_REST_API_URL;
        delete process.env.KV_REST_API_TOKEN;
    });

    test('hashes license keys without exposing raw values', () => {
        const hash = quotaStore.hashLicenseKey('MENACE_test_key');
        assert.equal(hash.length, 64);
        assert.notEqual(hash, 'MENACE_test_key');
    });

    test('allows requests under quota limits', async () => {
        const result = await quotaStore.checkAndConsumeQuota({
            licenseKey: 'MENACE_allowed',
            messages: [{ role: 'user', content: 'Hello' }],
            maxTokens: 256,
        });

        assert.equal(result.allowed, true);
        assert.equal(typeof result.licenseHash, 'string');
    });

    test('quota estimate uses conservative output reserve, not full generation ceiling', () => {
        const shortMessageEstimate = quotaStore.estimateRequestTokens(
            [{ role: 'user', content: 'Hello' }],
            4096
        );
        assert.ok(shortMessageEstimate < 500, 'short Menace answers should not reserve 4096 output tokens');

        const largeInputEstimate = quotaStore.estimateRequestTokens(
            [{ role: 'user', content: 'x'.repeat(40_000) }],
            4096
        );
        assert.ok(largeInputEstimate > 9_000, 'large inputs should count toward quota');
        assert.ok(
            quotaStore.estimateQuotaOutputTokens(4096) < 4096,
            'quota output reserve must stay below generation ceiling'
        );
    });

    test('allows requests in fail-open mode when quota storage is not configured', async () => {
        delete process.env.KV_REST_API_URL;
        delete process.env.KV_REST_API_TOKEN;
        delete process.env.MENACE_QUOTA_FAIL_OPEN;

        const result = await quotaStore.checkAndConsumeQuota({
            licenseKey: 'MENACE_missing_store',
            messages: [{ role: 'user', content: 'Hello' }],
            maxTokens: 256,
        });

        assert.equal(result.allowed, true);
        assert.equal(result.degraded, true);
    });

    test('fails safely when quota storage is unavailable and fail-open is disabled', async () => {
        delete process.env.KV_REST_API_URL;
        delete process.env.KV_REST_API_TOKEN;
        process.env.MENACE_QUOTA_FAIL_OPEN = '0';

        const result = await quotaStore.checkAndConsumeQuota({
            licenseKey: 'MENACE_missing_store',
            messages: [{ role: 'user', content: 'Hello' }],
            maxTokens: 256,
        });

        assert.equal(result.allowed, false);
        assert.equal(result.reason, 'quota_storage_unavailable');
    });
});
