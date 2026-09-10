'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const { extractCheckoutLinkId, resolveCheckoutRedirectUrl } = require('../polarConfig');
const polar = require('../polar');

describe('polar checkout URLs', () => {
    test('extracts checkout link id from buy.polar.sh URLs', () => {
        assert.equal(
            extractCheckoutLinkId('https://buy.polar.sh/polar_cl_KTTV9epSEVqEQ29pqzBgJwnxetHRb65GfJf0Y3FPc3Y'),
            'polar_cl_KTTV9epSEVqEQ29pqzBgJwnxetHRb65GfJf0Y3FPc3Y'
        );
    });

    test('rewrites buy.polar.sh URLs to API redirect endpoints', () => {
        assert.equal(
            resolveCheckoutRedirectUrl('https://buy.polar.sh/polar_cl_KTTV9epSEVqEQ29pqzBgJwnxetHRb65GfJf0Y3FPc3Y'),
            'https://api.polar.sh/v1/checkout-links/polar_cl_KTTV9epSEVqEQ29pqzBgJwnxetHRb65GfJf0Y3FPc3Y/redirect'
        );
    });

    test('getCheckoutUrl returns API redirect URLs for configured plans', () => {
        const result = polar.getCheckoutUrl('search_pass');
        assert.equal(result.success, true);
        assert.match(result.url, /\/v1\/checkout-links\/polar_cl_[^/]+\/redirect$/);
    });
});
