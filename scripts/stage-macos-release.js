'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { version } = require('../package.json');
const root = path.resolve(__dirname, '..');
const app = path.join(root, 'out/Menace Agent-darwin-arm64/Menace Agent.app');
const plist = path.join(app, 'Contents/Info.plist');
for (const key of ['CFBundleShortVersionString', 'CFBundleVersion']) {
    const actual = execFileSync('plutil', ['-extract', key, 'raw', plist], { encoding: 'utf8' }).trim();
    if (actual !== version) throw new Error(`${key} is ${actual}, expected ${version}`);
}
function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(full) : [full];
    });
}
const files = walk(path.join(root, 'out/make'));
const target = path.join(root, 'out/release');
fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });
const sums = [];
for (const extension of ['zip', 'dmg']) {
    const matches = files.filter(file => file.endsWith(`.${extension}`));
    if (matches.length !== 1) throw new Error(`Expected exactly one fresh ${extension}, found ${matches.length}`);
    const name = `Menace-Agent-${version}-darwin-arm64.${extension}`;
    fs.copyFileSync(matches[0], path.join(target, name));
    sums.push(`${crypto.createHash('sha256').update(fs.readFileSync(matches[0])).digest('hex')}  ${name}`);
}
fs.writeFileSync(path.join(target, 'SHA256SUMS'), `${sums.join('\n')}\n`);
console.log(`Versioned release artifacts staged in ${target}`);
