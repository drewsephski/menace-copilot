const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

const {
    buildSystemPrompt,
    getSystemPrompt,
    normalizePromptProfile,
    BANNED_LEGACY_PROMPT_FRAGMENTS,
    UNIVERSAL_RULES,
} = require('../prompts');

function assertNoBannedFragments(prompt, label) {
    for (const fragment of BANNED_LEGACY_PROMPT_FRAGMENTS) {
        assert.equal(
            prompt.toLowerCase().includes(fragment.toLowerCase()),
            false,
            `${label}: prompt must not contain banned legacy fragment "${fragment}"`
        );
    }
}

function assertNoInventedMetrics(prompt, label) {
    const metricPatterns = [
        /\b\d+%\s+(?:year over year|YoY|of deliverables|of our allocated budget|market share)/i,
        /\$\d+[KkMm]?\b/,
        /\b\d+\s+businesses\b/i,
        /\bROI within\b/i,
        /\bimplementation takes just \d+/i,
    ];

    for (const pattern of metricPatterns) {
        assert.equal(pattern.test(prompt), false, `${label}: prompt must not contain invented metric pattern ${pattern}`);
    }
}

describe('normalizePromptProfile', () => {
    test('maps legacy exam to custom', () => {
        assert.equal(normalizePromptProfile('exam'), 'custom');
    });

    test('falls back unknown profiles to custom', () => {
        assert.equal(normalizePromptProfile('unknown_mode'), 'custom');
        assert.equal(normalizePromptProfile(null), 'custom');
    });

    test('preserves known production profiles', () => {
        assert.equal(normalizePromptProfile('sales'), 'sales');
        assert.equal(normalizePromptProfile('interview'), 'interview');
    });
});

describe('prompt factuality guardrails', () => {
    test('every production profile includes universal factuality rules', () => {
        for (const profile of ['sales', 'meeting', 'interview', 'negotiation', 'presentation', 'custom']) {
            const prompt = getSystemPrompt(profile, '', false);
            assert.match(prompt, /Never invent or imply/i);
            assert.match(prompt, /spoken words directly/i);
            assertNoBannedFragments(prompt, profile);
            assertNoInventedMetrics(prompt, profile);
        }
    });

    test('search instructions appear only when search is available', () => {
        const withSearch = getSystemPrompt('sales', '', true);
        const withoutSearch = getSystemPrompt('sales', '', false);

        assert.match(withSearch, /Google Search/i);
        assert.doesNotMatch(withoutSearch, /You may use Google Search/i);
        assert.match(withoutSearch, /do not have search/i);
    });
});

describe('scenario prompts', () => {
    test('unknown sales pricing objection — no fabricated comparison guidance', () => {
        const prompt = getSystemPrompt(
            'sales',
            'Product: Menace Agent. No pricing or competitor details provided.',
            false
        );

        assert.match(prompt, /do not invent a comparison/i);
        assert.match(prompt, /acknowledge/i);
        assertNoBannedFragments(prompt, 'sales-unknown-pricing');
        assertNoInventedMetrics(prompt, 'sales-unknown-pricing');
        assert.doesNotMatch(prompt, /30%/);
    });

    test('known sales pricing objection — includes user pricing context without inventing extras', () => {
        const context = [
            'Product: Menace Agent',
            'Pricing: $39/month per seat',
            'Differentiator: local Whisper transcription + included AI overlay',
        ].join('\n');

        const prompt = getSystemPrompt('sales', context, false);
        const templateOnly = getSystemPrompt('sales', '', false);

        assert.match(prompt, /\$39\/month per seat/);
        assert.match(prompt, /local Whisper transcription/i);
        assertNoBannedFragments(prompt, 'sales-known-pricing');
        assertNoInventedMetrics(templateOnly, 'sales-template');
        assert.doesNotMatch(templateOnly, /500 businesses/);
    });

    test('interview question with missing metric — forbids fabrication', () => {
        const prompt = getSystemPrompt(
            'interview',
            'Resume: Led a frontend team. No specific performance metrics listed.',
            false
        );

        assert.match(prompt, /Never fabricate/i);
        assert.match(prompt, /metric or detail that is not in context/i);
        assertNoBannedFragments(prompt, 'interview-missing-metric');
    });

    test('project-status question without status context — meeting profile', () => {
        const prompt = getSystemPrompt(
            'meeting',
            'Agenda: Q3 planning. No project status data provided.',
            false
        );

        assert.match(prompt, /Never manufacture project status/i);
        assert.match(prompt, /percent complete/i);
        assertNoBannedFragments(prompt, 'meeting-no-status');
        assertNoInventedMetrics(prompt, 'meeting-no-status');
    });

    test('negotiation without benchmark data', () => {
        const prompt = getSystemPrompt(
            'negotiation',
            'Goal: renew contract. No market benchmarks or competing offers in context.',
            false
        );

        assert.match(prompt, /Never invent competing offers/i);
        assert.match(prompt, /market benchmarks/i);
        assertNoBannedFragments(prompt, 'negotiation-no-benchmark');
        assertNoInventedMetrics(prompt, 'negotiation-no-benchmark');
    });

    test('generic custom conversation', () => {
        const prompt = getSystemPrompt(
            'custom',
            'Help me run a podcast guest interview. Stay curious, no fake biographical claims.',
            false
        );

        assert.match(prompt, /Custom session behavior/i);
        assert.match(prompt, /podcast guest interview/i);
        assert.match(UNIVERSAL_RULES, /Never invent or imply/);
        assertNoBannedFragments(prompt, 'custom');
    });

    test('legacy unknown profile falls back to custom behavior', () => {
        const prompt = getSystemPrompt('exam', 'Legacy exam context', false);

        assert.match(prompt, /Custom session behavior/i);
        assert.equal(normalizePromptProfile('exam'), 'custom');
        assertNoBannedFragments(prompt, 'legacy-exam');
    });
});

describe('buildSystemPrompt structure', () => {
    test('layers context after profile behavior and before final reminder', () => {
        const prompt = buildSystemPrompt('sales', 'Battlecard: ACME Corp uses us for onboarding.', false);
        const universalIdx = prompt.indexOf('## Universal rules');
        const salesIdx = prompt.indexOf('## Sales call behavior');
        const contextIdx = prompt.indexOf('## User-provided context');
        const reminderIdx = prompt.indexOf('## Final reminder');

        assert.ok(universalIdx < salesIdx);
        assert.ok(salesIdx < contextIdx);
        assert.ok(contextIdx < reminderIdx);
        assert.match(prompt, /Battlecard: ACME Corp/);
    });

    test('empty context uses explicit placeholder', () => {
        const prompt = buildSystemPrompt('meeting', '   ', false);
        assert.match(prompt, /\(No additional context provided\.\)/);
    });
});
