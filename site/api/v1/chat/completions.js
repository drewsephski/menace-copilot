'use strict';

const { extractBearerToken, validateLicenseKey } = require('../../../lib/polarLicense');
const { validateChatRequest } = require('../../../lib/validateChatRequest');
const { checkRateLimit } = require('../../../lib/rateLimit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } = require('../../../lib/gatewayConfig');

function jsonError(status, message, extra = {}) {
    return new Response(JSON.stringify({ error: { message, ...extra } }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

async function proxyOpenRouter(payload) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw Object.assign(new Error('Hosted AI gateway is not configured'), { status: 503 });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            'HTTP-Referer': process.env.MENACE_GATEWAY_REFERER || 'https://menace-agent.vercel.app',
            'X-Title': 'Menace Agent Hosted Gateway',
        },
        body: JSON.stringify(payload),
    });

    return response;
}

module.exports = async function handler(request) {
    if (request.method !== 'POST') {
        return jsonError(405, 'Method not allowed');
    }

    const licenseKey = extractBearerToken(request.headers.get('authorization') || '');
    if (!licenseKey) {
        return jsonError(401, 'Missing license bearer token');
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return jsonError(400, 'Invalid JSON body');
    }

    const validated = validateChatRequest(body);
    if (!validated.ok) {
        return jsonError(validated.status, validated.error);
    }

    try {
        await validateLicenseKey(licenseKey);
    } catch (error) {
        const status = error.status || 401;
        return jsonError(status, error.message || 'License validation failed');
    }

    const rate = checkRateLimit(licenseKey, {
        windowMs: RATE_LIMIT_WINDOW_MS,
        maxRequests: RATE_LIMIT_MAX_REQUESTS,
    });
    if (!rate.allowed) {
        return jsonError(429, 'Rate limit exceeded', { retry_after: rate.retryAfterSec });
    }

    try {
        const upstream = await proxyOpenRouter(validated.payload);
        if (!upstream.ok) {
            const text = await upstream.text();
            const status = upstream.status >= 500 ? 502 : upstream.status;
            return jsonError(status, `Upstream provider error (${upstream.status})`, {
                detail: text.slice(0, 200),
            });
        }

        const headers = new Headers({
            'Content-Type': upstream.headers.get('content-type') || 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        });

        return new Response(upstream.body, { status: 200, headers });
    } catch (error) {
        const status = error.status || 500;
        return jsonError(status, error.message || 'Hosted AI gateway failed');
    }
};
