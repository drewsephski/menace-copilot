'use strict';

const PREMIUM_PLANS = [
    {
        sku: 'search_pass',
        name: '90-Day Pass',
        price: 79,
        note: '90 days · included AI',
        popular: false,
        highlights: ['AI included', 'No API keys', 'Best value'],
    },
    {
        sku: 'monthly',
        name: 'Monthly',
        price: 39,
        note: 'Cancel anytime · included AI',
        popular: true,
        highlights: ['AI included', 'No API keys', 'Live overlay'],
    },
    {
        sku: 'byok_monthly',
        name: 'BYOK',
        price: 15,
        note: 'Bring your own API keys',
        popular: false,
        highlights: ['Your Gemini key', 'Your OpenRouter key', 'App license'],
    },
];

function getPremiumPlan(sku) {
    return PREMIUM_PLANS.find(plan => plan.sku === sku) || null;
}

module.exports = {
    PREMIUM_PLANS,
    getPremiumPlan,
};
