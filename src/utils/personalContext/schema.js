'use strict';

const {
    PERSONAL_CONTEXT_SCHEMA,
    ALLOWED_SOURCES,
    ALLOWED_CONFIDENCE,
    FACT_ARRAY_KEYS,
    COMMUNICATION_KEYS,
    ALLOWED_TOP_LEVEL_KEYS,
    LIMITS,
} = require('./constants');

function isIsoDateOrNull(value) {
    if (value === null || value === undefined || value === '') {
        return true;
    }
    if (typeof value !== 'string') {
        return false;
    }
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeConfidence(value) {
    if (typeof value !== 'string') {
        return { confidence: 'medium', warning: 'Missing confidence; treated as medium.' };
    }
    const normalized = value.trim().toLowerCase();
    if (ALLOWED_CONFIDENCE.has(normalized)) {
        return { confidence: normalized, warning: null };
    }
    return { confidence: null, warning: `Invalid confidence "${value}"; fact rejected.` };
}

function normalizeFactEntry(raw, warnings) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        warnings.push('Skipped a fact entry that was not an object.');
        return null;
    }

    if (typeof raw.fact !== 'string') {
        warnings.push('Skipped a fact entry without a string "fact" field.');
        return null;
    }

    const fact = raw.fact.trim();
    if (!fact) {
        warnings.push('Skipped an empty fact entry.');
        return null;
    }

    if (fact.length > LIMITS.maxFactLength) {
        warnings.push(`Skipped a fact longer than ${LIMITS.maxFactLength} characters.`);
        return null;
    }

    const { confidence, warning } = normalizeConfidence(raw.confidence);
    if (warning) {
        warnings.push(warning);
    }
    if (!confidence) {
        return null;
    }

    let lastKnown = null;
    if (raw.lastKnown !== undefined && raw.lastKnown !== null && raw.lastKnown !== '') {
        if (!isIsoDateOrNull(raw.lastKnown)) {
            warnings.push(`Skipped invalid lastKnown date on fact: "${fact.slice(0, 40)}..."`);
            return null;
        }
        lastKnown = raw.lastKnown;
    }

    if (confidence === 'medium') {
        warnings.push(`Medium-confidence fact: "${fact.slice(0, 60)}${fact.length > 60 ? '...' : ''}"`);
    }

    if (lastKnown) {
        const parsed = Date.parse(`${lastKnown}T00:00:00Z`);
        if (Number.isFinite(parsed)) {
            const ageMs = Date.now() - parsed;
            const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));
            if (ageDays > 365) {
                warnings.push(`Possibly stale fact (${lastKnown}): "${fact.slice(0, 60)}${fact.length > 60 ? '...' : ''}"`);
            }
        }
    }

    return { fact, confidence, lastKnown };
}

function normalizeFactArray(rawValue, category, warnings, counters) {
    if (rawValue === undefined) {
        return [];
    }
    if (!Array.isArray(rawValue)) {
        warnings.push(`Category "${category}" must be an array; ignored.`);
        return [];
    }

    const normalized = [];
    for (const entry of rawValue) {
        if (counters.total >= LIMITS.maxFactsTotal) {
            warnings.push(`Import exceeds maximum of ${LIMITS.maxFactsTotal} facts; remaining entries dropped.`);
            break;
        }
        if (normalized.length >= LIMITS.maxFactsPerCategory) {
            warnings.push(`Category "${category}" exceeds ${LIMITS.maxFactsPerCategory} facts; remaining entries dropped.`);
            break;
        }

        const fact = normalizeFactEntry(entry, warnings);
        if (fact) {
            normalized.push(fact);
            counters.total += 1;
        }
    }

    return normalized;
}

function normalizeCommunication(rawValue, warnings, counters) {
    if (rawValue === undefined) {
        return { tone: [], formatPreferences: [], avoid: [] };
    }
    if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
        warnings.push('Communication block must be an object; ignored.');
        return { tone: [], formatPreferences: [], avoid: [] };
    }

    const communication = {};
    for (const key of COMMUNICATION_KEYS) {
        communication[key] = normalizeFactArray(rawValue[key], `communication.${key}`, warnings, counters);
    }

    for (const key of Object.keys(rawValue)) {
        if (!COMMUNICATION_KEYS.includes(key)) {
            warnings.push(`Unknown communication field "${key}" ignored.`);
        }
    }

    return communication;
}

function extractJsonFromImportText(text) {
    if (typeof text !== 'string') {
        return { error: 'Import text must be a string.' };
    }

    const trimmed = text.trim();
    if (!trimmed) {
        return { error: 'Import text is empty.' };
    }

    if (trimmed.length > LIMITS.maxImportBytes) {
        return { error: `Import exceeds maximum size of ${LIMITS.maxImportBytes} bytes.` };
    }

    try {
        return { data: JSON.parse(trimmed) };
    } catch {
        // fall through
    }

    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) {
        try {
            return { data: JSON.parse(fenceMatch[1].trim()) };
        } catch {
            return { error: 'Found a markdown JSON block but it was not valid JSON.' };
        }
    }

    return { error: 'Could not parse JSON. Paste raw JSON or a markdown code block containing JSON.' };
}

function countFacts(context) {
    if (!context) {
        return 0;
    }

    let total = 0;
    for (const key of FACT_ARRAY_KEYS) {
        total += Array.isArray(context[key]) ? context[key].length : 0;
    }
    if (context.communication && typeof context.communication === 'object') {
        for (const key of COMMUNICATION_KEYS) {
            total += Array.isArray(context.communication[key]) ? context.communication[key].length : 0;
        }
    }
    return total;
}

function getPresentCategories(context) {
    const present = [];
    if (!context) {
        return present;
    }

    for (const key of FACT_ARRAY_KEYS) {
        if (Array.isArray(context[key]) && context[key].length > 0) {
            present.push(key);
        }
    }

    if (context.communication) {
        const hasCommunication = COMMUNICATION_KEYS.some(
            key => Array.isArray(context.communication[key]) && context.communication[key].length > 0
        );
        if (hasCommunication) {
            present.push('communication');
        }
    }

    return present;
}

function validateAndNormalizePersonalContext(raw, { sourceOverride } = {}) {
    const warnings = [];
    const errors = [];

    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return { ok: false, errors: ['Root value must be a JSON object.'], warnings };
    }

    for (const key of Object.keys(raw)) {
        if (!ALLOWED_TOP_LEVEL_KEYS.has(key)) {
            warnings.push(`Unknown top-level field "${key}" ignored.`);
        }
    }

    if (raw.schema !== PERSONAL_CONTEXT_SCHEMA) {
        errors.push(`schema must be exactly "${PERSONAL_CONTEXT_SCHEMA}".`);
    }

    let generatedAt = null;
    if (raw.generatedAt !== undefined && raw.generatedAt !== null && raw.generatedAt !== '') {
        if (typeof raw.generatedAt !== 'string' || Number.isNaN(Date.parse(raw.generatedAt))) {
            errors.push('generatedAt must be an ISO date string or null.');
        } else {
            generatedAt = raw.generatedAt;
        }
    }

    let source = 'unknown';
    if (raw.source !== undefined && raw.source !== null && raw.source !== '') {
        if (typeof raw.source !== 'string' || !ALLOWED_SOURCES.has(raw.source)) {
            errors.push(`source must be one of: ${[...ALLOWED_SOURCES].join(', ')}.`);
        } else {
            source = raw.source;
        }
    }

    if (sourceOverride && ALLOWED_SOURCES.has(sourceOverride)) {
        source = sourceOverride;
    }

    const counters = { total: 0 };
    const normalized = {
        schema: PERSONAL_CONTEXT_SCHEMA,
        generatedAt,
        source,
    };

    if (typeof raw.importedAt === 'string' && !Number.isNaN(Date.parse(raw.importedAt))) {
        normalized.importedAt = raw.importedAt;
    }

    for (const key of FACT_ARRAY_KEYS) {
        normalized[key] = normalizeFactArray(raw[key], key, warnings, counters);
    }

    normalized.communication = normalizeCommunication(raw.communication, warnings, counters);

    if (errors.length > 0) {
        return { ok: false, errors, warnings };
    }

    if (counters.total === 0) {
        errors.push('Import must include at least one fact.');
        return { ok: false, errors, warnings };
    }

    return {
        ok: true,
        data: normalized,
        warnings,
        metadata: buildPersonalContextMetadata(normalized),
    };
}

function buildPersonalContextMetadata(context) {
    if (!context) {
        return {
            exists: false,
            source: null,
            generatedAt: null,
            importedAt: null,
            factCount: 0,
            categories: [],
        };
    }

    return {
        exists: true,
        source: context.source || 'unknown',
        generatedAt: context.generatedAt || null,
        importedAt: context.importedAt || null,
        factCount: countFacts(context),
        categories: getPresentCategories(context),
    };
}

function parsePersonalContextImport(text, options = {}) {
    const extracted = extractJsonFromImportText(text);
    if (extracted.error) {
        return { ok: false, errors: [extracted.error], warnings: [] };
    }

    return validateAndNormalizePersonalContext(extracted.data, options);
}

module.exports = {
    parsePersonalContextImport,
    validateAndNormalizePersonalContext,
    extractJsonFromImportText,
    countFacts,
    getPresentCategories,
    buildPersonalContextMetadata,
};
