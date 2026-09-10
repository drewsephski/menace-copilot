#!/usr/bin/env node
'use strict';

/**
 * Create a 100% discount code for test-mode Polar checkouts.
 *
 * Requires POLAR_ACCESS_TOKEN with discounts:write (and discounts:read).
 *
 * Usage:
 *   node scripts/create-polar-test-discount.js
 *   node scripts/create-polar-test-discount.js --code MENACE100
 */

const path = require('path');

require(path.join(__dirname, '..', 'src', 'utils', 'loadEnv')).loadEnv();

const SERVER = process.env.POLAR_SERVER || 'production';
const API_ORIGIN = SERVER === 'sandbox' ? 'https://sandbox-api.polar.sh' : 'https://api.polar.sh';
const TOKEN = process.env.POLAR_ACCESS_TOKEN || '';
const CODE = process.argv.find((arg, i) => process.argv[i - 1] === '--code') || 'MENACE100';

async function polarRequest(method, pathname, body) {
    const response = await fetch(`${API_ORIGIN}${pathname}`, {
        method,
        headers: {
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
        const detail = payload?.detail || payload?.error || response.statusText;
        throw new Error(`${method} ${pathname} failed (${response.status}): ${JSON.stringify(detail)}`);
    }

    return payload;
}

async function listProducts() {
    const data = await polarRequest('GET', '/v1/products/?limit=100');
    return data.items || [];
}

async function findExistingDiscount(code) {
    const data = await polarRequest('GET', `/v1/discounts/?limit=100&query=${encodeURIComponent(code)}`);
    const items = data.items || [];
    return items.find(item => item.code?.toUpperCase() === code.toUpperCase()) || null;
}

async function main() {
    if (!TOKEN) {
        throw new Error('Set POLAR_ACCESS_TOKEN in .env');
    }

    const existing = await findExistingDiscount(CODE);
    if (existing) {
        console.log(`Discount already exists: ${existing.name}`);
        console.log(`  code: ${existing.code}`);
        console.log(`  id: ${existing.id}`);
        console.log(`  basis_points: ${existing.basis_points}`);
        console.log('\nUse at checkout — enter code:', existing.code);
        return;
    }

    const products = await listProducts();
    const productIds = products.map(p => p.id);

    const body = {
        name: 'Test 100% Off',
        code: CODE,
        type: 'percentage',
        basis_points: 10000,
        duration: 'once',
        max_redemptions: 50,
        products: productIds.length > 0 ? productIds : null,
    };

    const discount = await polarRequest('POST', '/v1/discounts/', body);

    console.log('Created 100% test discount:');
    console.log(`  name: ${discount.name}`);
    console.log(`  code: ${discount.code}`);
    console.log(`  id: ${discount.id}`);
    console.log(`  products: ${(discount.products || productIds).length} linked`);
    console.log('\nAt Polar checkout, click "Add discount code" and enter:', discount.code);
    console.log('Total should be $0.00 — works in test mode.');
}

main().catch(error => {
    console.error(error.message || error);
    if (String(error.message || '').includes('403') || String(error.message || '').includes('401')) {
        console.error('\nYour org token may need discounts:read and discounts:write scopes.');
        console.error('Create a new token at polar.sh → Settings → Developers.');
    }
    process.exit(1);
});
