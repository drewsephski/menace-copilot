'use strict';

const { FACT_ARRAY_KEYS, COMMUNICATION_KEYS, PROFILE_CATEGORY_MAP, CATEGORY_LABELS, LIMITS } = require('./constants');

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

function joinSections(sections) {
    return sections.filter(Boolean).join('\n\n');
}

function trimSectionToBudget(section, maxChars) {
    if (!section || section.length <= maxChars) {
        return section;
    }

    const headerEnd = section.indexOf(':\n');
    if (headerEnd === -1) {
        return '';
    }

    const header = section.slice(0, headerEnd + 2);
    const body = section.slice(headerEnd + 2);
    const lines = body.split('\n').filter(Boolean);
    const kept = [];

    for (const line of lines) {
        const candidate = `${header}${kept.concat(line).join('\n')}`;
        if (candidate.length > maxChars) {
            break;
        }
        kept.push(line);
    }

    if (kept.length === 0) {
        return '';
    }

    return `${header}${kept.join('\n')}`;
}

function trimRenderedSectionsToBudget(sections, maxChars) {
    const kept = [];

    for (const section of sections) {
        const prefix = kept.length > 0 ? '\n\n' : '';
        const next = kept.length > 0 ? `${joinSections(kept)}${prefix}${section}` : section;
        if (next.length <= maxChars) {
            kept.push(section);
            continue;
        }

        const remaining = maxChars - (kept.length > 0 ? joinSections(kept).length + 2 : 0);
        if (remaining <= 0) {
            break;
        }

        const trimmed = trimSectionToBudget(section, remaining);
        if (trimmed) {
            kept.push(trimmed);
        }
        break;
    }

    return joinSections(kept);
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

    return trimRenderedSectionsToBudget(sections, LIMITS.maxRenderedChars);
}

module.exports = {
    renderPersonalContextForProfile,
    formatFactLine,
    trimRenderedSectionsToBudget,
};
