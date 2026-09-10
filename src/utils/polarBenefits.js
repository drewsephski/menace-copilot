'use strict';

const { loadPolarProductionConfig } = require('../config/loadPolarProductionConfig');
const { normalizeBenefitCatalog } = require('../config/hostedAiEntitlement');

function loadBenefitCatalog() {
    const generated = loadPolarProductionConfig();
    if (!generated) {
        return normalizeBenefitCatalog({});
    }

    return normalizeBenefitCatalog(generated.benefits || {});
}

module.exports = {
    loadBenefitCatalog,
};
