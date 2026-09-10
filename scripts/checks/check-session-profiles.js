'use strict';

const path = require('path');

async function main() {
    const profilesPath = path.join(__dirname, '..', '..', 'src', 'config', 'sessionProfiles.js');
    const profiles = await import(profilesPath);

    const { SESSION_PROFILE_ORDER, SESSION_PROFILES, DEFAULT_SESSION_PROFILE_ID, normalizeProfileId } = profiles;

    if (!Array.isArray(SESSION_PROFILE_ORDER) || SESSION_PROFILE_ORDER.length < 5) {
        throw new Error('SESSION_PROFILE_ORDER is missing or too short');
    }

    for (const id of SESSION_PROFILE_ORDER) {
        const profile = SESSION_PROFILES[id];
        if (!profile || profile.id !== id) {
            throw new Error(`Profile registry mismatch for id: ${id}`);
        }
        if (!profile.label || !profile.startLabel) {
            throw new Error(`Profile ${id} is missing required labels`);
        }
    }

    if (normalizeProfileId('exam') !== 'custom') {
        throw new Error('Legacy exam profile should map to custom');
    }

    if (normalizeProfileId('unknown-profile') !== DEFAULT_SESSION_PROFILE_ID) {
        throw new Error('Unknown profile should fall back to default');
    }

    console.log(`Session profiles OK (${SESSION_PROFILE_ORDER.length} profiles, default: ${DEFAULT_SESSION_PROFILE_ID})`);
}

main().catch(error => {
    console.error('Session profile check failed:', error.message);
    process.exit(1);
});
