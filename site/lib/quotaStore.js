'use strict';

const crypto = require('crypto');
const {
    RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS,
    DAILY_REQUEST_LIMIT,
    DAILY_TOKEN_BUDGET,
    MAX_OUTPUT_TOKENS,
    QUOTA_ESTIMATED_OUTPUT_TOKENS,
} = require('./gatewayConfig');

function hashLicenseKey(licenseKey) {
    return crypto.createHash('sha256').update(String(licenseKey)).digest('hex');
}

function getRedisConfig() {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
    if (!url || !token) {
        return null;
    }
    return { url, token };
}

function isQuotaStorageConfigured() {
    return getRedisConfig() !== null;
}

function isQuotaFailOpenEnabled() {
    const flag = process.env.MENACE_QUOTA_FAIL_OPEN;
    if (flag === '1' || flag === 'true') {
        return true;
    }
    if (flag === '0' || flag === 'false') {
        return false;
    }

    // Beta default: if durable quota storage was never configured, do not block hosted AI.
    return !isQuotaStorageConfigured();
}

function allowWithoutQuotaStorage({ licenseKey, messages, maxTokens }) {
    return {
        allowed: true,
        licenseHash: hashLicenseKey(licenseKey),
        estimatedTokens: estimateRequestTokens(messages, maxTokens),
        retryAfterSec: 0,
        degraded: true,
    };
}

async function redisCommand(command) {
    const config = getRedisConfig();
    if (!config) {
        return { unavailable: true };
    }

    const response = await fetch(config.url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${config.token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
    });

    if (!response.ok) {
        return { unavailable: true };
    }

    const payload = await response.json();
    if (payload.error) {
        return { unavailable: true };
    }

    return { unavailable: false, result: payload.result };
}

function utcDayKey() {
    return new Date().toISOString().slice(0, 10);
}

function estimateInputTokens(messages) {
    let inputChars = 0;
    if (Array.isArray(messages)) {
        for (const message of messages) {
            if (typeof message?.content === 'string') {
                inputChars += message.content.length;
            } else if (Array.isArray(message?.content)) {
                for (const part of message.content) {
                    if (part?.type === 'text' && typeof part.text === 'string') {
                        inputChars += part.text.length;
                    }
                }
            }
        }
    }

    return Math.ceil(inputChars / 4);
}

function estimateQuotaOutputTokens(maxTokens) {
    const requested = Number(maxTokens);
    const generationCeiling = Math.min(
        MAX_OUTPUT_TOKENS,
        Math.max(1, Number.isFinite(requested) && requested > 0 ? Math.floor(requested) : MAX_OUTPUT_TOKENS)
    );
    return Math.min(QUOTA_ESTIMATED_OUTPUT_TOKENS, generationCeiling);
}

function estimateRequestTokens(messages, maxTokens) {
    return estimateInputTokens(messages) + estimateQuotaOutputTokens(maxTokens);
}

async function checkAndConsumeQuota({ licenseKey, messages, maxTokens }) {
    const licenseHash = hashLicenseKey(licenseKey);
    const minuteKey = `menace:rpm:${licenseHash}`;
    const day = utcDayKey();
    const dayRequestsKey = `menace:dayreq:${licenseHash}:${day}`;
    const dayTokensKey = `menace:daytok:${licenseHash}:${day}`;
    const estimatedTokens = estimateRequestTokens(messages, maxTokens);

    const minuteCount = await redisCommand(['INCR', minuteKey]);
    if (minuteCount.unavailable) {
        if (isQuotaFailOpenEnabled()) {
            console.warn('[gateway] quota storage unavailable; allowing request in fail-open mode');
            return allowWithoutQuotaStorage({ licenseKey, messages, maxTokens });
        }
        return { allowed: false, reason: 'quota_storage_unavailable', retryAfterSec: 0 };
    }

    if (minuteCount.result === 1) {
        await redisCommand(['EXPIRE', minuteKey, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)]);
    }

    if (minuteCount.result > RATE_LIMIT_MAX_REQUESTS) {
        const ttl = await redisCommand(['TTL', minuteKey]);
        const retryAfterSec = ttl.unavailable ? 60 : Math.max(1, Number(ttl.result) || 60);
        return { allowed: false, reason: 'rate_limit_exceeded', retryAfterSec };
    }

    const dayRequests = await redisCommand(['INCR', dayRequestsKey]);
    if (dayRequests.unavailable) {
        return { allowed: false, reason: 'quota_storage_unavailable', retryAfterSec: 0 };
    }

    if (dayRequests.result === 1) {
        await redisCommand(['EXPIRE', dayRequestsKey, 86_400]);
    }

    if (dayRequests.result > DAILY_REQUEST_LIMIT) {
        return { allowed: false, reason: 'daily_request_limit_exceeded', retryAfterSec: 3600 };
    }

    const dayTokens = await redisCommand(['INCRBY', dayTokensKey, estimatedTokens]);
    if (dayTokens.unavailable) {
        return { allowed: false, reason: 'quota_storage_unavailable', retryAfterSec: 0 };
    }

    if (dayTokens.result === estimatedTokens) {
        await redisCommand(['EXPIRE', dayTokensKey, 86_400]);
    }

    if (dayTokens.result > DAILY_TOKEN_BUDGET) {
        return { allowed: false, reason: 'daily_token_budget_exceeded', retryAfterSec: 3600 };
    }

    return {
        allowed: true,
        licenseHash,
        estimatedTokens,
        retryAfterSec: 0,
    };
}

module.exports = {
    hashLicenseKey,
    estimateInputTokens,
    estimateQuotaOutputTokens,
    estimateRequestTokens,
    checkAndConsumeQuota,
    getRedisConfig,
    isQuotaStorageConfigured,
    isQuotaFailOpenEnabled,
};
