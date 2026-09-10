const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { PREMIUM_PLANS, getPremiumPlan } = require('../../config/premiumPlans');

describe('premium plan display names', () => {
    test('search_pass displays as 90-Day Pass', () => {
        const plan = getPremiumPlan('search_pass');
        assert.equal(plan.name, '90-Day Pass');
        assert.equal(plan.sku, 'search_pass');
    });

    test('monthly is marked popular', () => {
        const monthly = PREMIUM_PLANS.find(plan => plan.sku === 'monthly');
        const pass = PREMIUM_PLANS.find(plan => plan.sku === 'search_pass');
        assert.equal(monthly.popular, true);
        assert.equal(pass.popular, false);
    });

    test('in-app picker copy matches shared plan names', () => {
        const pickerSource = fs.readFileSync(
            path.join(__dirname, '..', '..', 'components', 'ui', 'premiumPlanPicker.js'),
            'utf8'
        );
        assert.match(pickerSource, /name: '90-Day Pass'/);
        assert.match(pickerSource, /name: 'Monthly'/);
        assert.match(pickerSource, /popular: true/);
    });
});
