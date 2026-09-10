#!/usr/bin/env node
'use strict';

/**
 * Sync production Polar org + checkout links into polarProduction.public.json.
 *
 * Requires in .env:
 *   POLAR_ACCESS_TOKEN=...   (production org token from polar.sh → Settings → Developers)
 *
 * Usage:
 *   node scripts/sync-polar-production.js --dry-run
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
const DRY_RUN = process.argv.includes('--dry-run') || !WRITE;

const PRODUCT_SPECS = [
    {
        sku: 'search_pass',
        name: '90-Day Pass',
        description: '90 days of Menace Agent with included hosted AI answers, screen context, and local Whisper transcription.',
        recurring: false,
        priceAmount: 7900,
        licenseLabel: 'Menace overlay license (90-day)',
        licenseExpires: { days: 90 },
        hostedAi: true,
    },
    {
        sku: 'monthly',
        name: 'Monthly',
        description: 'Monthly Menace Agent with included hosted AI answers, screen context, and local Whisper transcription.',
        recurring: true,
        priceAmount: 3900,
        licenseLabel: 'Menace overlay license (monthly)',
        licenseExpires: null,
        hostedAi: true,
    },
    {
        sku: 'byok_monthly',
        name: 'BYOK',
        description: 'Bring your own API keys. App license for overlay, Gemini Live, and screen context without hosted AI.',
        recurring: true,
        priceAmount: 1500,
        licenseLabel: 'Menace BYOK license (monthly)',
        licenseExpires: null,
        hostedAi: false,
    },
];

const report = {
    products: { create: [], update: [], unchanged: [] },
    benefits: { create: [], attach: [] },
    checkoutLinks: { create: [], update: [] },
};

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

function productNeedsUpdate(product, spec) {
    const metadataSku = product.metadata?.sku || '';
    return product.name !== spec.name || product.description !== spec.description || metadataSku !== spec.sku;
}

async function ensureProductBenefits(productId, benefitId, productName) {
    if (DRY_RUN && String(productId).startsWith('dry-run-')) {
        report.benefits.attach.push({ productId, benefitId, productName });
        return;
    }

    const product = await polarRequest('GET', `/v1/products/${productId}`);
    const attached = (product.benefits || []).some(item => item.id === benefitId);
    if (attached) {
        return;
    }

    if (DRY_RUN) {
        report.benefits.attach.push({ productId, benefitId, productName });
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

    if (DRY_RUN) {
        const placeholder = { id: `dry-run-benefit-${label}`, description: label };
        report.benefits.create.push({ label, expiresDays });
        return placeholder;
    }

    const benefit = await polarRequest('POST', `/v1/benefits/`, body);
    return benefit;
}

async function ensureBenefit(spec, benefitsByLabel) {
    let benefit = benefitsByLabel.get(spec.licenseLabel);
    if (!benefit) {
        benefit = await createLicenseBenefit(spec.licenseLabel, spec.licenseExpires ? spec.licenseExpires.days : null);
        benefitsByLabel.set(spec.licenseLabel, benefit);
    }

    return benefit;
}

async function ensureProduct(organizationId, spec, existingProducts, benefitsByLabel) {
    let product = existingProducts.find(item => item.metadata?.sku === spec.sku || item.name === spec.name);

    const benefit = await ensureBenefit(spec, benefitsByLabel);

    if (!product) {
        if (DRY_RUN) {
            report.products.create.push({ sku: spec.sku, name: spec.name });
            product = { id: `dry-run-product-${spec.sku}`, name: spec.name, metadata: { sku: spec.sku } };
        } else {
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
        }
    } else if (productNeedsUpdate(product, spec)) {
        if (DRY_RUN) {
            report.products.update.push({
                sku: spec.sku,
                id: product.id,
                from: { name: product.name, description: product.description },
                to: { name: spec.name, description: spec.description },
            });
        } else {
            product = await polarRequest('PATCH', `/v1/products/${product.id}`, {
                name: spec.name,
                description: spec.description,
                metadata: { ...(product.metadata || {}), sku: spec.sku },
            });
            console.log(`Updated product: ${spec.name} (${product.id})`);
        }
    } else {
        report.products.unchanged.push({ sku: spec.sku, id: product.id, name: product.name });
        console.log(`Found product: ${spec.name} (${product.id})`);
    }

    await ensureProductBenefits(product.id, benefit.id, spec.name);
    return product;
}

function checkoutLinkRedirectUrl(linkId) {
    return `${API_ORIGIN}/v1/checkout-links/${linkId}/redirect`;
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

    if (found?.id) {
        const redirectUrl = checkoutLinkRedirectUrl(found.id);
        if (DRY_RUN) {
            report.checkoutLinks.update.push({ label, id: found.id, url: redirectUrl });
            return redirectUrl;
        }

        await polarRequest('PATCH', `/v1/checkout-links/${found.id}`, linkPayload);
        console.log(`Updated checkout link: ${label}`);
        return redirectUrl;
    }

    if (DRY_RUN) {
        report.checkoutLinks.create.push({ label, productId: product.id });
        return `https://dry-run.polar.sh/${label}`;
    }

    const created = await polarRequest('POST', '/v1/checkout-links/', {
        payment_processor: 'stripe',
        label,
        products: [product.id],
        ...linkPayload,
    });

    console.log(`Created checkout link: ${label}`);
    return checkoutLinkRedirectUrl(created.id);
}

async function main() {
    if (!TOKEN) {
        throw new Error('Set POLAR_ACCESS_TOKEN in .env (production token from polar.sh → Settings → Developers).');
    }

    const org = await findOrganization();
    console.log(`Organization: ${org.name} (${org.id}) slug=${org.slug} server=${SERVER}`);
    console.log(`Mode: ${DRY_RUN ? 'dry-run/report' : 'write'}`);

    const [products, links, benefits] = await Promise.all([listProducts(org.id), listCheckoutLinks(org.id), listBenefits()]);
    const benefitsByLabel = new Map(benefits.filter(item => item.type === 'license_keys').map(item => [item.description, item]));

    const checkout = {};
    const benefitCatalog = {};
    for (const spec of PRODUCT_SPECS) {
        const product = await ensureProduct(org.id, spec, products, benefitsByLabel);
        checkout[spec.sku] = await ensureCheckoutLink(org.id, product, spec.name, links);
        const benefit = benefitsByLabel.get(spec.licenseLabel);
        if (benefit) {
            benefitCatalog[spec.sku] = {
                id: benefit.id,
                label: spec.licenseLabel,
                hostedAi: spec.hostedAi,
            };
        }
    }

    const generated = {
        server: SERVER,
        organizationId: org.id,
        checkout,
        benefits: benefitCatalog,
    };

    console.log('\nGenerated Polar config:\n', JSON.stringify(generated, null, 2));
    console.log('\nSync report:\n', JSON.stringify(report, null, 2));

    if (WRITE) {
        const generatedJson = `${JSON.stringify(generated, null, 4)}\n`;
        const appPath = path.join(__dirname, '..', 'src', 'config', 'polarProduction.public.json');
        const sitePath = path.join(__dirname, '..', 'site', 'lib', 'polarProduction.public.json');
        fs.writeFileSync(appPath, generatedJson, 'utf8');
        fs.writeFileSync(sitePath, generatedJson, 'utf8');
        console.log(`\nWrote ${appPath}`);
        console.log(`Wrote ${sitePath}`);
    } else {
        console.log('\nDry-run only. Run with --write to save src/config/polarProduction.public.json');
    }
}

main().catch(error => {
    console.error(error.message || error);
    process.exit(1);
});
