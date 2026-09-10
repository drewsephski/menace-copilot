'use strict';

const fs = require('fs');
const path = require('path');
const { normalizeBenefitCatalog } = require('../config/hostedAiEntitlement');

function loadBenefitCatalog() {
    const generatedPath = path.join(__dirname, 'polarConfig.generated.json');
    if (!fs.existsSync(generatedPath)) {
        return normalizeBenefitCatalog({});
    }

    try {
        const generated = JSON.parse(fs.readFileSync(generatedPath, 'utf8'));
        return normalizeBenefitCatalog(generated.benefits || {});
    } catch (error) {
        console.warn('Could not read Polar benefit catalog:', error.message);
        return normalizeBenefitCatalog({});
    }
}

module.exports = {
    loadBenefitCatalog,
};
