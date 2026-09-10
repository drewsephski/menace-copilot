'use strict';

const fs = require('fs');
const path = require('path');

function discoverTestFiles(rootDir = path.join(__dirname, '..', '..')) {
    const testsDir = path.join(rootDir, 'src', 'utils', '__tests__');
    if (!fs.existsSync(testsDir)) {
        return [];
    }

    return fs
        .readdirSync(testsDir)
        .filter(name => name.endsWith('.test.js'))
        .map(name => path.join(testsDir, name))
        .sort();
}

module.exports = {
    discoverTestFiles,
};
