'use strict';

const fs = require('fs');
const path = require('path');
const { normalizeBenefitCatalog } = require('./hostedAiEntitlement');

const ALLOWED_MODELS = new Set([
    'google/gemini-2.5-flash',
    'google/gemini-2.5-flash-lite',
    'google/gemini-3.5-flash-lite',
    'google/gemini-3-flash-preview',
]);

const DEFAULT_MODEL = 'google/gemini-3.5-flash-lite';
const MAX_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 12000;
const MAX_TOTAL_CHARS = 48000;
const MAX_IMAGE_CHARS = 2_000_000;
const MAX_OUTPUT_TOKENS = 4096;
const MIN_TEMPERATURE = 0;
const MAX_TEMPERATURE = 1;
const DEFAULT_TEMPERATURE = 0.4;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const DAILY_REQUEST_LIMIT = 500;
const DAILY_TOKEN_BUDGET = 250_000;

// Defense in depth: also set an account-level monthly spend ceiling in the OpenRouter dashboard.
// See https://openrouter.ai/settings/limits

const PUBLIC_CONFIG_PATH = path.join(__dirname, 'polarProduction.public.json');

function loadPublicPolarConfig() {
    if (!fs.existsSync(PUBLIC_CONFIG_PATH)) {
        return null;
    }

    try {
        return JSON.parse(fs.readFileSync(PUBLIC_CONFIG_PATH, 'utf8'));
    } catch {
        return null;
    }
}

function loadBenefitCatalog() {
    if (process.env.MENACE_POLAR_BENEFITS_JSON) {
        try {
            return normalizeBenefitCatalog(JSON.parse(process.env.MENACE_POLAR_BENEFITS_JSON));
        } catch {
            return normalizeBenefitCatalog({});
        }
    }

    const publicConfig = loadPublicPolarConfig();
    if (publicConfig) {
        return normalizeBenefitCatalog(publicConfig.benefits || {});
    }

    return normalizeBenefitCatalog({});
}

function getPolarOrganizationId() {
    return process.env.POLAR_ORGANIZATION_ID || loadPublicPolarConfig()?.organizationId || '';
}

function getPolarApiOrigin() {
    return process.env.POLAR_SERVER === 'sandbox' ? 'https://sandbox-api.polar.sh' : 'https://api.polar.sh';
}

function clampTemperature(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return DEFAULT_TEMPERATURE;
    }
    return Math.min(MAX_TEMPERATURE, Math.max(MIN_TEMPERATURE, parsed));
}

function clampMaxTokens(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return MAX_OUTPUT_TOKENS;
    }
    return Math.min(MAX_OUTPUT_TOKENS, Math.floor(parsed));
}

function getProductionModel() {
    const configured = typeof process.env.MENACE_GATEWAY_MODEL === 'string' ? process.env.MENACE_GATEWAY_MODEL.trim() : '';
    if (configured && ALLOWED_MODELS.has(configured)) {
        return configured;
    }
    return DEFAULT_MODEL;
}

function resolveModel(_requested) {
    return getProductionModel();
}

module.exports = {
    ALLOWED_MODELS,
    DEFAULT_MODEL,
    MAX_MESSAGES,
    MAX_MESSAGE_CHARS,
    MAX_TOTAL_CHARS,
    MAX_IMAGE_CHARS,
    MAX_OUTPUT_TOKENS,
    RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS,
    DAILY_REQUEST_LIMIT,
    DAILY_TOKEN_BUDGET,
    loadBenefitCatalog,
    getPolarOrganizationId,
    getPolarApiOrigin,
    clampTemperature,
    clampMaxTokens,
    getProductionModel,
    resolveModel,
};
