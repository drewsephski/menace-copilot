#!/usr/bin/env node
'use strict';

const BASE_URL = process.env.MENACE_GATEWAY_BASE_URL || 'https://menace-agent.vercel.app';

async function request(method, body, headers = {}) {
    const started = Date.now();
    const response = await fetch(`${BASE_URL}/api/v1/chat/completions`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const elapsedMs = Date.now() - started;
    const text = await response.text();
    return { status: response.status, text, elapsedMs, contentType: response.headers.get('content-type') || '' };
}

async function main() {
    const results = {};

    results.get = await request('GET');
    results.postNoAuth = await request('POST', { messages: [{ role: 'user', content: 'ping' }] });
    results.postInvalidLicense = await request(
        'POST',
        { messages: [{ role: 'user', content: 'ping' }] },
        { Authorization: 'Bearer MENACE_invalid_test_key_00000000' }
    );

    const includedKey = process.env.MENACE_TEST_INCLUDED_LICENSE_KEY || '';
    if (includedKey) {
        results.postIncluded = await request(
            'POST',
            {
                messages: [{ role: 'user', content: 'Reply with exactly: gateway-ok' }],
                stream: true,
            },
            { Authorization: `Bearer ${includedKey}` }
        );
    }

    const byokKey = process.env.MENACE_TEST_BYOK_LICENSE_KEY || '';
    if (byokKey) {
        results.postByok = await request('POST', { messages: [{ role: 'user', content: 'ping' }] }, { Authorization: `Bearer ${byokKey}` });
    }

    console.log(JSON.stringify({ baseUrl: BASE_URL, results }, null, 2));
}

main().catch(error => {
    console.error(error.message || error);
    process.exit(1);
});
