'use strict';

const prompts = require('../../src/utils/prompts');

function main() {
    const salesPrompt = prompts.getSystemPrompt('sales', 'Acme Corp sells widgets.', false);
    if (!salesPrompt.includes('Universal rules') || !salesPrompt.includes('Acme Corp sells widgets.')) {
        throw new Error('Sales system prompt missing universal rules or user context');
    }

    const unknownProfilePrompt = prompts.getSystemPrompt('not-a-real-profile', '', true);
    if (!unknownProfilePrompt.includes('Custom session behavior')) {
        throw new Error('Unknown profile should fall back to custom behavior');
    }

    for (const fragment of prompts.BANNED_LEGACY_PROMPT_FRAGMENTS) {
        if (salesPrompt.includes(fragment)) {
            throw new Error(`Banned legacy fragment leaked into prompt: ${fragment}`);
        }
    }

    const normalized = prompts.normalizePromptProfile('exam');
    if (normalized !== 'custom') {
        throw new Error('normalizePromptProfile(exam) should return custom');
    }

    console.log('Prompt fallback and safety checks OK');
}

try {
    main();
} catch (error) {
    console.error('Prompt check failed:', error.message);
    process.exit(1);
}
