'use strict';

const fs = require('fs');
const path = require('path');
const { safeStorage } = require('electron');

const ENCRYPTED_PREFIX = '__enc__:';
const SECRET_FIELD_NAMES = ['apiKey', 'openrouterApiKey', 'licenseKey', 'licenseActivationId', 'cloudToken', 'openaiKey'];

function isEncryptionAvailable() {
    try {
        return safeStorage.isEncryptionAvailable();
    } catch {
        return false;
    }
}

function encryptSecret(plaintext) {
    if (typeof plaintext !== 'string' || plaintext.length === 0) {
        return '';
    }

    if (!isEncryptionAvailable()) {
        return plaintext;
    }

    const encrypted = safeStorage.encryptString(plaintext);
    return `${ENCRYPTED_PREFIX}${encrypted.toString('base64')}`;
}

function decryptSecret(stored) {
    if (typeof stored !== 'string' || stored.length === 0) {
        return '';
    }

    if (!stored.startsWith(ENCRYPTED_PREFIX)) {
        return stored;
    }

    if (!isEncryptionAvailable()) {
        console.warn('Encrypted credential present but OS encryption is unavailable');
        return '';
    }

    try {
        const buffer = Buffer.from(stored.slice(ENCRYPTED_PREFIX.length), 'base64');
        return safeStorage.decryptString(buffer);
    } catch (error) {
        console.warn('Failed to decrypt credential:', error.message);
        return '';
    }
}

function encryptCredentialFields(credentials) {
    const next = { ...credentials };
    for (const field of SECRET_FIELD_NAMES) {
        if (typeof next[field] === 'string' && next[field].length > 0 && !next[field].startsWith(ENCRYPTED_PREFIX)) {
            next[field] = encryptSecret(next[field]);
        }
    }
    next.secretsEncrypted = isEncryptionAvailable();
    return next;
}

function decryptCredentialFields(credentials) {
    const next = { ...credentials };
    for (const field of SECRET_FIELD_NAMES) {
        if (typeof next[field] === 'string') {
            next[field] = decryptSecret(next[field]);
        }
    }
    return next;
}

function hasPlaintextSecrets(credentials) {
    return SECRET_FIELD_NAMES.some(field => {
        const value = credentials[field];
        return typeof value === 'string' && value.length > 0 && !value.startsWith(ENCRYPTED_PREFIX);
    });
}

function migrateCredentialsFile(credentialsPath) {
    if (!fs.existsSync(credentialsPath)) {
        return false;
    }

    let raw;
    try {
        raw = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    } catch (error) {
        console.warn('Could not read credentials for encryption migration:', error.message);
        return false;
    }

    if (!raw || typeof raw !== 'object') {
        return false;
    }

    if (raw.secretsEncrypted && !hasPlaintextSecrets(raw)) {
        return false;
    }

    if (!hasPlaintextSecrets(raw)) {
        return false;
    }

    const encrypted = encryptCredentialFields(raw);
    fs.writeFileSync(credentialsPath, JSON.stringify(encrypted, null, 2), 'utf8');
    console.log('Migrated credentials to OS-protected storage');
    return true;
}

module.exports = {
    SECRET_FIELD_NAMES,
    encryptCredentialFields,
    decryptCredentialFields,
    migrateCredentialsFile,
    isEncryptionAvailable,
};
