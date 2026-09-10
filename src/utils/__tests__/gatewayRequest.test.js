const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const validateChatRequest = require(path.join(
    __dirname,
    '..',
    '..',
    '..',
    'site',
    'lib',
    'validateChatRequest.js'
)).validateChatRequest;

describe('hosted gateway request validation', () => {
    test('selects production model server-side and clamps unsafe parameters', () => {
        const result = validateChatRequest({
            messages: [{ role: 'user', content: 'Hello' }],
            temperature: 9,
            max_tokens: 999999,
        });

        assert.equal(result.ok, true);
        assert.equal(result.payload.model, 'google/gemini-3.5-flash-lite');
        assert.equal(result.payload.temperature, 1);
        assert.equal(result.payload.max_tokens, 4096);
    });

    test('ignores unsupported client model selection and uses production model', () => {
        const result = validateChatRequest({
            model: 'openai/gpt-4o',
            messages: [{ role: 'user', content: 'Hello' }],
        });

        assert.equal(result.ok, true);
        assert.equal(result.payload.model, 'google/gemini-3.5-flash-lite');
    });

    test('rejects arbitrary provider parameters', () => {
        const result = validateChatRequest({
            provider: { order: ['openai'] },
            messages: [{ role: 'user', content: 'Hello' }],
        });

        assert.equal(result.ok, false);
        assert.match(result.error, /not allowed/i);
    });

    test('rejects oversized message payloads', () => {
        const result = validateChatRequest({
            messages: [{ role: 'user', content: 'x'.repeat(20000) }],
        });
        assert.equal(result.ok, false);
        assert.match(result.error, /too large/i);
    });
});
