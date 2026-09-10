'use strict';

const storage = require('../storage');
const { getHostedApiBaseUrl, isHostedGatewayConfigured } = require('../config/publicRuntimeConfig');

function getLicenseAuthorizationHeader() {
    const license = storage.getLicense();
    const key = license?.key;
    if (!key || typeof key !== 'string' || key.trim().length === 0) {
        return null;
    }

    return `Bearer ${key.trim()}`;
}

function assertHostedGatewayReady() {
    const baseUrl = getHostedApiBaseUrl();
    if (!baseUrl) {
        throw new Error('Hosted AI gateway is not configured. Set MENACE_HOSTED_API_BASE_URL at packaging time.');
    }

    const auth = getLicenseAuthorizationHeader();
    if (!auth) {
        throw new Error('Active license required for included AI');
    }

    return { baseUrl: baseUrl.replace(/\/+$/, ''), auth };
}

async function streamHostedChatCompletion({ model, messages, onToken, temperature = 0.7, maxTokens = 16384 }) {
    const { baseUrl, auth } = assertHostedGatewayReady();

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            Authorization: auth,
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
        },
        body: JSON.stringify({
            model,
            messages,
            stream: true,
            temperature,
            max_tokens: maxTokens,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Hosted AI gateway error ${response.status}: ${errorText.slice(0, 200)}`);
    }

    const reader = response.body?.getReader?.();
    if (!reader) {
        const payload = await response.json();
        const text = payload?.choices?.[0]?.message?.content || '';
        if (text && onToken) {
            onToken(text, true);
        }
        return { fullText: text, finishReason: payload?.choices?.[0]?.finish_reason || 'stop' };
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let finishReason = 'stop';
    let isFirst = true;

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) {
                continue;
            }

            const data = trimmed.slice(5).trim();
            if (!data || data === '[DONE]') {
                continue;
            }

            let json;
            try {
                json = JSON.parse(data);
            } catch {
                continue;
            }

            finishReason = json.choices?.[0]?.finish_reason || finishReason;
            const token = json.choices?.[0]?.delta?.content || '';
            if (!token) {
                continue;
            }

            fullText += token;
            if (onToken) {
                onToken(fullText, isFirst);
                isFirst = false;
            }
        }
    }

    return { fullText, finishReason };
}

module.exports = {
    isHostedGatewayConfigured,
    getLicenseAuthorizationHeader,
    streamHostedChatCompletion,
};
