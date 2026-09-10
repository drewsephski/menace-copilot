'use strict';

const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { extractBearerToken, validateLicenseKey } = require('../../../lib/polarLicense');
const { validateChatRequest } = require('../../../lib/validateChatRequest');
const { checkAndConsumeQuota } = require('../../../lib/quotaStore');

function sendJson(res, status, message, extra = {}) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: { message, ...extra } }));
}

async function parseJsonBody(req) {
    if (req.body !== undefined && req.body !== null) {
        if (typeof req.body === 'string') {
            return req.body ? JSON.parse(req.body) : null;
        }
        return req.body;
    }

    const chunks = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    if (chunks.length === 0) {
        return null;
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
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

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        sendJson(res, 405, 'Method not allowed');
        return;
    }

    const licenseKey = extractBearerToken(req.headers.authorization || '');
    if (!licenseKey) {
        sendJson(res, 401, 'Missing license bearer token');
        return;
    }

    let body;
    try {
        body = await parseJsonBody(req);
    } catch {
        sendJson(res, 400, 'Invalid JSON body');
        return;
    }

    const validated = validateChatRequest(body);
    if (!validated.ok) {
        sendJson(res, validated.status, validated.error);
        return;
    }

    try {
        await validateLicenseKey(licenseKey);
    } catch (error) {
        const status = error.status || 401;
        sendJson(res, status, error.message || 'License validation failed');
        return;
    }

    const quota = await checkAndConsumeQuota({
        licenseKey,
        messages: validated.payload.messages,
        maxTokens: validated.payload.max_tokens,
    });
    if (!quota.allowed) {
        const status = quota.reason === 'quota_storage_unavailable' ? 503 : 429;
        const message =
            quota.reason === 'quota_storage_unavailable'
                ? 'Hosted AI quota service unavailable'
                : 'Rate or quota limit exceeded';
        sendJson(res, status, message, { retry_after: quota.retryAfterSec, reason: quota.reason });
        return;
    }

    try {
        const upstream = await proxyOpenRouter(validated.payload);
        if (!upstream.ok) {
            const text = await upstream.text();
            const status = upstream.status >= 500 ? 502 : upstream.status;
            sendJson(res, status, `Upstream provider error (${upstream.status})`, {
                detail: text.slice(0, 200),
            });
            return;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', upstream.headers.get('content-type') || 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        if (upstream.body) {
            await pipeline(Readable.fromWeb(upstream.body), res);
        } else {
            res.end();
        }
    } catch (error) {
        const status = error.status || 500;
        sendJson(res, status, error.message || 'Hosted AI gateway failed');
    }
};
