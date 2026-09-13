'use strict';

const assert = require('node:assert/strict');
const { getUpdateSource } = require('../../src/config/updateSource');
const { getLocalAiBinariesBaseUrl } = require('../../src/config/releaseSource');
const source = getUpdateSource('1.0.1', 'darwin', 'arm64');
assert.equal(source.feedUrl, 'https://update.electronjs.org/drewsephski/menace-copilot/darwin-arm64/1.0.1');
assert.equal(source.releasePageUrl, 'https://github.com/drewsephski/menace-copilot/releases/latest');
assert.throws(() => getUpdateSource('../other', 'darwin', 'arm64'));
assert.throws(() => getUpdateSource('1.0.1', 'darwin', 'x64'));
const binariesUrl = getLocalAiBinariesBaseUrl();
assert.ok(binariesUrl === null || typeof binariesUrl === 'string');
console.log('Update/release source configuration OK');
