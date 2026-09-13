'use strict';

// Fixed in the signed app: neither renderer input nor a legacy .env manifest
// can redirect the installer to another publisher. Stable GitHub releases only.
const UPDATE_REPOSITORY = 'drewsephski/menace-copilot';
function getUpdateSource(version, platform = process.platform, arch = process.arch) {
    if (!/^\d+\.\d+\.\d+$/.test(version || '')) throw new Error('Updates require a stable numeric app version');
    if (platform !== 'darwin' || arch !== 'arm64') throw new Error('Unsupported release platform');
    return {
        feedUrl: `https://update.electronjs.org/${UPDATE_REPOSITORY}/${platform}-${arch}/${version}`,
        releasePageUrl: `https://github.com/${UPDATE_REPOSITORY}/releases/latest`,
    };
}

module.exports = { getUpdateSource, UPDATE_REPOSITORY };
