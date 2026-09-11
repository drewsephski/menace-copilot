'use strict';

const {
    MAX_MESSAGES,
    MAX_MESSAGE_CHARS,
    MAX_TOTAL_CHARS,
    MAX_IMAGE_CHARS,
    getProductionModel,
    clampTemperature,
    clampMaxTokens,
} = require('./gatewayConfig');

function measureMessageContent(content) {
    if (typeof content === 'string') {
        return { textChars: content.length, imageChars: 0 };
    }

    if (!Array.isArray(content)) {
        return { textChars: 0, imageChars: 0 };
    }

    let textChars = 0;
    let imageChars = 0;
    for (const part of content) {
        if (!part || typeof part !== 'object') {
            continue;
        }
        if (part.type === 'text' && typeof part.text === 'string') {
            textChars += part.text.length;
        }
        if (part.type === 'image_url' && typeof part.image_url?.url === 'string') {
            imageChars += part.image_url.url.length;
        }
    }
    return { textChars, imageChars };
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

    let totalTextChars = 0;
    let totalImageChars = 0;
    for (const message of body.messages) {
        if (!message || typeof message !== 'object') {
            return { ok: false, status: 400, error: 'Invalid message entry' };
        }

        const role = typeof message.role === 'string' ? message.role : '';
        if (!['system', 'user', 'assistant'].includes(role)) {
            return { ok: false, status: 400, error: 'Unsupported message role' };
        }

        const { textChars, imageChars } = measureMessageContent(message.content);

        if (imageChars > MAX_IMAGE_CHARS) {
            return { ok: false, status: 400, error: 'Image too large' };
        }
        if (textChars > MAX_MESSAGE_CHARS) {
            return { ok: false, status: 400, error: 'Message too large' };
        }

        totalTextChars += textChars;
        totalImageChars += imageChars;
    }

    if (totalTextChars > MAX_TOTAL_CHARS) {
        return { ok: false, status: 400, error: 'Request payload too large' };
    }
    if (totalImageChars > MAX_IMAGE_CHARS) {
        return { ok: false, status: 400, error: 'Request payload too large' };
    }

    const blockedFields = [
        'provider',
        'route',
        'transforms',
        'models',
        'api_key',
        'apiKey',
        'tool_choice',
        'tools',
        'response_format',
        'plugins',
        'modalities',
    ];
    for (const field of blockedFields) {
        if (field in body) {
            return { ok: false, status: 400, error: `Field not allowed: ${field}` };
        }
    }

    return {
        ok: true,
        payload: {
            model: getProductionModel(),
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
