'use strict';

const {
    FACT_ARRAY_KEYS,
    COMMUNICATION_KEYS,
    PROFILE_CATEGORY_MAP,
    CATEGORY_LABELS,
    LIMITS,
} = require('./constants');
function normalizeProfileForRender(profile) {
    if (!profile || profile === 'exam') {
        return 'custom';
    }
    if (PROFILE_CATEGORY_MAP[profile]) {
        return profile;
    }
    return 'custom';
}

function formatFactLine(entry) {
    const parts = [`- ${entry.fact}`];
    if (entry.confidence === 'medium') {
        parts.push('(medium confidence)');
    }
    if (entry.lastKnown) {
        parts.push(`(as of ${entry.lastKnown})`);
    }
    return parts.join(' ');
}

function renderCategoryLines(entries, label) {
    if (!Array.isArray(entries) || entries.length === 0) {
        return '';
    }

    const lines = entries.map(formatFactLine);
    return `${label}:\n${lines.join('\n')}`;
}

function renderCommunicationBlock(communication) {
    if (!communication || typeof communication !== 'object') {
        return '';
    }

    const sections = [];
    const subLabels = {
        tone: 'Preferred tone',
        formatPreferences: 'Format preferences',
        avoid: 'Avoid',
    };

    for (const key of COMMUNICATION_KEYS) {
        const block = renderCategoryLines(communication[key], subLabels[key]);
        if (block) {
            sections.push(block);
        }
    }

    if (sections.length === 0) {
        return '';
    }

    return `Communication:\n${sections.join('\n')}`;
}

function renderPersonalContextForProfile(personalContext, profile) {
    if (!personalContext) {
        return '';
    }

    const normalizedProfile = normalizeProfileForRender(profile);
    const categories = PROFILE_CATEGORY_MAP[normalizedProfile] || PROFILE_CATEGORY_MAP.custom;
    const sections = [];

    for (const key of categories) {
        if (key === 'communication') {
            const block = renderCommunicationBlock(personalContext.communication);
            if (block) {
                sections.push(block);
            }
            continue;
        }

        const block = renderCategoryLines(personalContext[key], CATEGORY_LABELS[key] || key);
        if (block) {
            sections.push(block);
        }
    }

    if (sections.length === 0) {
        return '';
    }

    let rendered = sections.join('\n\n');
    if (rendered.length > LIMITS.maxRenderedChars) {
        rendered = `${rendered.slice(0, LIMITS.maxRenderedChars - 3)}...`;
    }

    return rendered;
}

module.exports = {
    renderPersonalContextForProfile,
    formatFactLine,
};
