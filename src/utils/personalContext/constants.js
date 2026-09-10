'use strict';

const PERSONAL_CONTEXT_SCHEMA = 'menace-personal-context/v1';

const ALLOWED_SOURCES = new Set(['chatgpt', 'claude', 'gemini', 'manual', 'unknown']);

const ALLOWED_CONFIDENCE = new Set(['high', 'medium']);

const FACT_ARRAY_KEYS = [
    'identity',
    'background',
    'skills',
    'career',
    'projects',
    'goals',
    'interests',
    'preferences',
    'constraints',
    'recurringContext',
];

const COMMUNICATION_KEYS = ['tone', 'formatPreferences', 'avoid'];

const ALLOWED_TOP_LEVEL_KEYS = new Set([
    'schema',
    'generatedAt',
    'source',
    'importedAt',
    ...FACT_ARRAY_KEYS,
    'communication',
]);

const LIMITS = {
    maxImportBytes: 100_000,
    maxFactsTotal: 200,
    maxFactsPerCategory: 50,
    maxFactLength: 500,
    maxRenderedChars: 2500,
};

const PROFILE_CATEGORY_MAP = {
    interview: ['identity', 'background', 'skills', 'career', 'projects', 'goals', 'communication'],
    sales: ['identity', 'career', 'projects', 'communication', 'preferences'],
    meeting: ['identity', 'career', 'projects', 'goals', 'recurringContext', 'communication'],
    negotiation: ['identity', 'goals', 'preferences', 'constraints', 'communication'],
    presentation: ['identity', 'background', 'skills', 'career', 'projects', 'communication'],
    custom: [...FACT_ARRAY_KEYS, 'communication'],
};

const CATEGORY_LABELS = {
    identity: 'Identity',
    background: 'Background',
    skills: 'Skills',
    career: 'Career',
    projects: 'Projects',
    goals: 'Goals',
    interests: 'Interests',
    preferences: 'Preferences',
    constraints: 'Constraints',
    recurringContext: 'Recurring commitments',
    communication: 'Communication',
};

module.exports = {
    PERSONAL_CONTEXT_SCHEMA,
    ALLOWED_SOURCES,
    ALLOWED_CONFIDENCE,
    FACT_ARRAY_KEYS,
    COMMUNICATION_KEYS,
    ALLOWED_TOP_LEVEL_KEYS,
    LIMITS,
    PROFILE_CATEGORY_MAP,
    CATEGORY_LABELS,
};
