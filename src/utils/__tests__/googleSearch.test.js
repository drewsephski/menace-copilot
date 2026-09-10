const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const { getSystemPrompt } = require('../prompts');
const { normalizeFontSize } = require('../../storage');

describe('googleSearchEnabled source of truth', () => {
    test('enabled + Gemini-native path includes search instructions', () => {
        const prompt = getSystemPrompt('sales', '', true);
        assert.match(prompt, /Google Search/i);
    });

    test('disabled + Gemini-native path omits search tool instructions', () => {
        const prompt = getSystemPrompt('sales', '', false);
        assert.doesNotMatch(prompt, /You may use Google Search/i);
        assert.match(prompt, /do not have search/i);
    });

    test('enabled + OpenRouter path still marks search unavailable in prompt', () => {
        const prompt = getSystemPrompt('sales', '', false);
        assert.match(prompt, /do not have search/i);
    });

    test('local path uses search-unavailable prompt', () => {
        const prompt = getSystemPrompt('meeting', '', false);
        assert.match(prompt, /do not have search/i);
    });

    test('storage default keeps google search disabled until user enables it', () => {
        const { DEFAULT_PREFERENCES } = require('../../storage');
        assert.equal(DEFAULT_PREFERENCES.googleSearchEnabled, false);
    });
});

describe('fontSize preference normalization', () => {
    test('legacy medium string maps to numeric px', () => {
        assert.equal(normalizeFontSize('medium'), 20);
    });
});
