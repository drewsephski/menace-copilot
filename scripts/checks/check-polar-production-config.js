'use strict';

const { loadPolarProductionConfig, assertProductionPolarConfig } = require('../../src/config/loadPolarProductionConfig');

function main() {
    const config = loadPolarProductionConfig();
    const problems = assertProductionPolarConfig(config);

    if (problems.length > 0) {
        throw new Error(problems.join('; '));
    }

    console.log('Polar production public config check OK');
}

try {
    main();
} catch (error) {
    console.error('Polar production public config check failed:', error.message);
    process.exit(1);
}
