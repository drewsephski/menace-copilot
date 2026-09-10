'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Load .env from the project root without adding a dotenv dependency.
 * Existing process.env values are never overwritten.
 */
function loadEnv() {
    const candidates = [
        path.join(__dirname, '..', '..', '.env'),
        path.join(process.cwd(), '.env'),
    ];

    for (const envPath of candidates) {
        if (!fs.existsSync(envPath)) {
            continue;
        }

        try {
            const content = fs.readFileSync(envPath, 'utf8');
            for (const line of content.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) {
                    continue;
                }

                const eq = trimmed.indexOf('=');
                if (eq === -1) {
                    continue;
                }

                const key = trimmed.slice(0, eq).trim();
                let value = trimmed.slice(eq + 1).trim();

                if (
                    (value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))
                ) {
                    value = value.slice(1, -1);
                }

                if (key && process.env[key] === undefined) {
                    process.env[key] = value;
                }
            }
        } catch (error) {
            console.warn('Could not read .env:', error.message);
        }

        return;
    }
}

module.exports = { loadEnv };
