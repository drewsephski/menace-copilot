'use strict';

const {
    MAX_MESSAGES,
    MAX_MESSAGE_CHARS,
    MAX_TOTAL_CHARS,
    MAX_IMAGE_CHARS,
    resolveModel,
    clampTemperature,
    clampMaxTokens,
} = require('./gatewayConfig');

function messageContentLength(content) {
    if (typeof content === 'string') {
        return content.length;
    }

    if (!Array.isArray(content)) {
        return 0;
    }

    let total = 0;
    for (const part of content) {
        if (!part || typeof part !== 'object') {
            continue;
        }
        if (part.type === 'text' && typeof part.text === 'string') {
            total += part.text.length;
        }
        if (part.type === 'image_url' && typeof part.image_url?.url === 'string') {
            total += part.image_url.url.length;
            if (part.image_url.url.length > MAX_IMAGE_CHARS) {
                return MAX_IMAGE_CHARS + 1;
            }
        }
    }
    return total;
}

function validateChatRequest(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { ok: false, status: 400, error: 'Invalid JSON body' };
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
        return { ok: false, status: 400, error: 'messages array is required' };
    }

    if (body.messages.length > MAX_MESSAGES) {
        return { ok: false, status: 400, error: 'Too many messages' };
    }

    let totalChars = 0;
    for (const message of body.messages) {
        if (!message || typeof message !== 'object') {
            return { ok: false, status: 400, error: 'Invalid message entry' };
        }

        const role = typeof message.role === 'string' ? message.role : '';
        if (!['system', 'user', 'assistant'].includes(role)) {
            return { ok: false, status: 400, error: 'Unsupported message role' };
        }

        const length = messageContentLength(message.content);
        if (length > MAX_MESSAGE_CHARS) {
            return { ok: false, status: 400, error: 'Message too large' };
        }
        totalChars += length;
    }

    if (totalChars > MAX_TOTAL_CHARS) {
        return { ok: false, status: 400, error: 'Request payload too large' };
    }

    const blockedFields = ['provider', 'route', 'transforms', 'models', 'api_key', 'apiKey'];
    for (const field of blockedFields) {
        if (field in body) {
            return { ok: false, status: 400, error: `Field not allowed: ${field}` };
        }
    }

    return {
        ok: true,
        payload: {
            model: resolveModel(body.model),
            messages: body.messages,
            stream: body.stream !== false,
            temperature: clampTemperature(body.temperature),
            max_tokens: clampMaxTokens(body.max_tokens),
        },
    };
}

module.exports = {
    validateChatRequest,
};
