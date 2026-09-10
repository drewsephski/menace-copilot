#!/usr/bin/env node
'use strict';

/**
 * Sync production Polar org + checkout links into polarConfig.generated.json.
 *
 * Requires in .env:
 *   POLAR_ACCESS_TOKEN=...   (production org token from polar.sh → Settings → Developers)
 *
 * Usage:
 *   node scripts/sync-polar-production.js
 *   node scripts/sync-polar-production.js --write
 */

const fs = require('fs');
const path = require('path');

require(path.join(__dirname, '..', 'src', 'utils', 'loadEnv')).loadEnv();

const SERVER = process.env.POLAR_SERVER || 'production';
const API_ORIGIN = SERVER === 'sandbox' ? 'https://sandbox-api.polar.sh' : 'https://api.polar.sh';
const TOKEN = process.env.POLAR_ACCESS_TOKEN || '';
const ORG_SLUG = process.env.POLAR_ORG_SLUG || 'menace';
const SUCCESS_URL = process.env.POLAR_SUCCESS_URL || 'https://menace-agent.vercel.app/success.html';
const WRITE = process.argv.includes('--write');

const PRODUCT_SPECS = [
    {
        sku: 'search_pass',
        name: 'Menace Search Pass',
        description: '90 days. Live interview autocue with included AI answers, Gemini screen context, and local Whisper.',
        recurring: false,
        priceAmount: 7900,
        licenseLabel: 'Menace overlay license (90-day)',
        licenseExpires: { days: 90 },
    },
    {
        sku: 'monthly',
        name: 'Menace Monthly',
        description: 'Cancel anytime. Included AI answers, Gemini screen context, and local Whisper transcription.',
        recurring: true,
        priceAmount: 3900,
        licenseLabel: 'Menace overlay license (monthly)',
        licenseExpires: null,
    },
    {
        sku: 'byok_monthly',
        name: 'Menace BYOK',
        description:
            'App license only — $15/mo. Use your own Gemini and OpenRouter keys. Required for overlay, Gemini Live, and screen context.',
        recurring: true,
        priceAmount: 1500,
        licenseLabel: 'Menace BYOK license (monthly)',
        licenseExpires: null,
    },
];

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

async function findOrganization() {
    const data = await polarRequest('GET', `/v1/organizations/?slug=${encodeURIComponent(ORG_SLUG)}&limit=10`);
    const org = (data.items || []).find(item => item.slug === ORG_SLUG);
    if (!org) {
        throw new Error(`No Polar organization with slug "${ORG_SLUG}" on ${SERVER}. Create it at https://polar.sh first.`);
    }
    return org;
}

async function listProducts(organizationId) {
    const data = await polarRequest('GET', `/v1/products/?organization_id=${organizationId}&limit=100`);
    return data.items || [];
}

async function listCheckoutLinks(organizationId) {
    const data = await polarRequest('GET', `/v1/checkout-links/?organization_id=${organizationId}&limit=100`);
    return data.items || [];
}

async function listBenefits() {
    const data = await polarRequest('GET', '/v1/benefits/?limit=100');
    return data.items || [];
}

async function ensureProductBenefits(productId, benefitId, productName) {
    const product = await polarRequest('GET', `/v1/products/${productId}`);
    const attached = (product.benefits || []).some(item => item.id === benefitId);
    if (attached) {
        return;
    }

    await polarRequest('POST', `/v1/products/${productId}/benefits`, {
        benefits: [benefitId],
    });
    console.log(`Attached license benefit to ${productName}`);
}

async function createLicenseBenefit(label, expiresDays) {
    const body = {
        type: 'license_keys',
        description: label,
        properties: {
            prefix: 'MENACE',
            // No device activation slots — keys validate via /validate (simpler for desktop app).
            activations: null,
            ...(expiresDays
                ? {
                      expires: {
                          ttl: expiresDays,
                          timeframe: 'day',
                      },
                  }
                : {}),
        },
    };

    // Org tokens infer organization — do not pass organization_id in body
    const benefit = await polarRequest('POST', `/v1/benefits/`, body);

    return benefit;
}

async function ensureBenefit(spec, benefitsByLabel) {
    let benefit = benefitsByLabel.get(spec.licenseLabel);
    if (!benefit) {
        benefit = await createLicenseBenefit(
            spec.licenseLabel,
            spec.licenseExpires ? spec.licenseExpires.days : null
        );
        benefitsByLabel.set(spec.licenseLabel, benefit);
    }

    return benefit;
}

async function ensureProduct(organizationId, spec, existingProducts, benefitsByLabel) {
    let product = existingProducts.find(
        item => item.metadata?.sku === spec.sku || item.name === spec.name
    );

    const benefit = await ensureBenefit(spec, benefitsByLabel);

    if (!product) {
        product = await polarRequest('POST', '/v1/products/', {
            name: spec.name,
            description: spec.description,
            metadata: { sku: spec.sku },
            prices: [
                {
                    amount_type: 'fixed',
                    price_amount: spec.priceAmount,
                    price_currency: 'usd',
                    ...(spec.recurring
                        ? {
                              type: 'recurring',
                              recurring_interval: 'month',
                              recurring_interval_count: 1,
                          }
                        : { type: 'one_time' }),
                },
            ],
        });

        console.log(`Created product: ${spec.name} (${product.id})`);
    } else {
        console.log(`Found product: ${spec.name} (${product.id})`);
    }

    await ensureProductBenefits(product.id, benefit.id, spec.name);

    return product;
}

async function ensureCheckoutLink(organizationId, product, label, existingLinks) {
    const found = existingLinks.find(link => {
        if (link.label === label) return true;
        return (link.products || []).some(item => item.id === product.id);
    });

    const linkPayload = {
        allow_discount_codes: true,
        success_url: SUCCESS_URL,
    };

    if (found?.url) {
        await polarRequest('PATCH', `/v1/checkout-links/${found.id}`, linkPayload);
        console.log(`Updated checkout link: ${label}`);
        return found.url;
    }

    const created = await polarRequest('POST', '/v1/checkout-links/', {
        payment_processor: 'stripe',
        label,
        products: [product.id],
        ...linkPayload,
    });

    console.log(`Created checkout link: ${label}`);
    return created.url;
}

async function main() {
    if (!TOKEN) {
        throw new Error('Set POLAR_ACCESS_TOKEN in .env (production token from polar.sh → Settings → Developers).');
    }

    const org = await findOrganization();
    console.log(`Organization: ${org.name} (${org.id}) slug=${org.slug} server=${SERVER}`);

    const [products, links, benefits] = await Promise.all([
        listProducts(org.id),
        listCheckoutLinks(org.id),
        listBenefits(),
    ]);
    const benefitsByLabel = new Map(
        benefits.filter(item => item.type === 'license_keys').map(item => [item.description, item])
    );

    const checkout = {};
    for (const spec of PRODUCT_SPECS) {
        const product = await ensureProduct(org.id, spec, products, benefitsByLabel);
        checkout[spec.sku] = await ensureCheckoutLink(org.id, product, spec.name, links);
    }

    const generated = {
        server: SERVER,
        organizationId: org.id,
        checkout,
    };

    console.log('\nGenerated Polar config:\n', JSON.stringify(generated, null, 2));

    if (WRITE) {
        const outPath = path.join(__dirname, '..', 'src', 'utils', 'polarConfig.generated.json');
        fs.writeFileSync(outPath, `${JSON.stringify(generated, null, 4)}\n`, 'utf8');
        console.log(`\nWrote ${outPath}`);
    } else {
        console.log('\nRun with --write to save src/utils/polarConfig.generated.json');
    }
}

main().catch(error => {
    console.error(error.message || error);
    process.exit(1);
});
