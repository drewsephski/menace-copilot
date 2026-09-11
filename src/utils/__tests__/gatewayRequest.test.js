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
const { MAX_IMAGE_CHARS } = require(path.join(__dirname, '..', '..', '..', 'site', 'lib', 'gatewayConfig'));

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

    test('accepts vision messages with base64 image payloads', () => {
        const result = validateChatRequest({
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'What is on this screen?' },
                        {
                            type: 'image_url',
                            image_url: { url: `data:image/jpeg;base64,${'A'.repeat(150_000)}` },
                        },
                    ],
                },
            ],
        });

        assert.equal(result.ok, true);
    });

    test('rejects vision messages when image payload exceeds image limit', () => {
        const result = validateChatRequest({
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Describe this screen' },
                        {
                            type: 'image_url',
                            image_url: { url: `data:image/jpeg;base64,${'A'.repeat(MAX_IMAGE_CHARS + 1)}` },
                        },
                    ],
                },
            ],
        });

        assert.equal(result.ok, false);
        assert.match(result.error, /image too large/i);
    });
});
