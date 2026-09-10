const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

const { escapeHtml, sanitizeHtml, stripDangerousMarkup, renderSafeMarkdown, isSafeHref } = require('../safeMarkdown');

function markedLikeParse(text) {
    return text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
}

function assertNoExecutableMarkup(html, label) {
    assert.doesNotMatch(html, /<script/i, `${label}: script tags must not survive`);
    assert.doesNotMatch(html, /\son\w+\s*=/i, `${label}: event handlers must not survive`);
    assert.doesNotMatch(html, /javascript:/i, `${label}: javascript URLs must not survive`);
    assert.doesNotMatch(html, /<iframe/i, `${label}: iframe must not survive`);
    assert.doesNotMatch(html, /<svg/i, `${label}: svg must not survive`);
}

describe('safeMarkdown', () => {
    test('escapeHtml neutralizes raw tags before parsing', () => {
        const escaped = escapeHtml('<img src=x onerror=alert(1)>');
        assert.match(escaped, /&lt;img/);
        assert.doesNotMatch(escaped, /<img/i);
    });

    test('isSafeHref rejects javascript URLs', () => {
        assert.equal(isSafeHref('javascript:alert(1)'), false);
        assert.equal(isSafeHref('https://example.com'), true);
    });

    test('stripDangerousMarkup removes adversarial payloads', () => {
        const samples = [
            '<img src=x onerror=alert(1)>',
            '<a href="javascript:alert(1)">click</a>',
            '<script>alert(1)</script>',
            '<svg onload=alert(1)></svg>',
            '<p safe>ok</p><iframe src="evil"></iframe>',
            '**bold** <script>x</script>',
        ];

        for (const sample of samples) {
            const sanitized = stripDangerousMarkup(sample);
            assertNoExecutableMarkup(sanitized, sample);
        }
    });

    test('sanitizeHtml uses non-DOM fallback without executable markup', () => {
        const original = global.DOMParser;
        global.DOMParser = undefined;

        const sanitized = sanitizeHtml('<img src=x onerror=alert(1)><script>alert(1)</script>');
        assertNoExecutableMarkup(sanitized, 'sanitizeHtml fallback');

        global.DOMParser = original;
    });

    test('renderSafeMarkdown keeps lightweight markdown but blocks HTML execution', () => {
        const originalDomParser = global.DOMParser;
        global.DOMParser = undefined;

        const rendered = renderSafeMarkdown('**Hello** <img src=x onerror=alert(1)>', { parse: markedLikeParse });
        assert.match(rendered, /<strong>Hello<\/strong>/);
        assertNoExecutableMarkup(rendered, 'renderSafeMarkdown');

        global.DOMParser = originalDomParser;
    });
});
