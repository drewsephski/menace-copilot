'use strict';

const fs = require('fs');
const path = require('path');
const { getConfigDir } = require('../storage');
const { validateAndNormalizePersonalContext, buildPersonalContextMetadata, parsePersonalContextImport } = require('./personalContext/schema');
const { buildChatGPTPersonalContextExportPrompt } = require('./personalContext/importPrompt');

const ENCRYPTED_PREFIX = '__enc__:';
const ENCRYPTION_UNAVAILABLE_ERROR =
    'Secure storage is unavailable on this Mac. Personal Context cannot be saved until macOS encryption is available.';

function getPersonalContextPath() {
    return path.join(getConfigDir(), 'personal-context.json');
}

function getSafeStorage() {
    if (process.env.MENACE_TEST_MOCK_ENCRYPTION === '1' && global.__menaceTestSafeStorage) {
        return global.__menaceTestSafeStorage;
    }

    try {
        const electron = require('electron');
        if (electron && typeof electron === 'object' && electron.safeStorage) {
            return electron.safeStorage;
        }
    } catch {
        return null;
    }

    return null;
}

function isEncryptionAvailable() {
    try {
        const storage = getSafeStorage();
        return Boolean(storage && typeof storage.isEncryptionAvailable === 'function' && storage.isEncryptionAvailable());
    } catch {
        return false;
    }
}

function encryptPayload(plaintext) {
    if (typeof plaintext !== 'string' || plaintext.length === 0) {
        return '';
    }

    if (!isEncryptionAvailable()) {
        return null;
    }

    const storage = getSafeStorage();
    const encrypted = storage.encryptString(plaintext);
    return `${ENCRYPTED_PREFIX}${encrypted.toString('base64')}`;
}

function decryptPayload(stored) {
    if (typeof stored !== 'string' || stored.length === 0) {
        return '';
    }

    if (!stored.startsWith(ENCRYPTED_PREFIX)) {
        return stored;
    }

    if (!isEncryptionAvailable()) {
        console.warn('Encrypted personal context present but OS encryption is unavailable');
        return '';
    }

    try {
        const storage = getSafeStorage();
        const buffer = Buffer.from(stored.slice(ENCRYPTED_PREFIX.length), 'base64');
        return storage.decryptString(buffer);
    } catch (error) {
        console.warn('Failed to decrypt personal context:', error.message);
        return '';
    }
}

function readStoredEnvelope() {
    const filePath = getPersonalContextPath();
    if (!fs.existsSync(filePath)) {
        return null;
    }

    try {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!raw || typeof raw !== 'object') {
            return null;
        }
        return raw;
    } catch (error) {
        console.warn('Could not read personal context file:', error.message);
        return null;
    }
}

function writeStoredEnvelope(envelope) {
    const filePath = getPersonalContextPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(envelope, null, 2), 'utf8');
}

function getPersonalContext() {
    const envelope = readStoredEnvelope();
    if (!envelope || typeof envelope.payload !== 'string') {
        return null;
    }

    const decrypted = decryptPayload(envelope.payload);
    if (!decrypted) {
        return null;
    }

    try {
        const parsed = JSON.parse(decrypted);
        const result = validateAndNormalizePersonalContext(parsed);
        return result.ok ? result.data : null;
    } catch {
        return null;
    }
}

function setPersonalContext(context, { sourceOverride } = {}) {
    const result = validateAndNormalizePersonalContext(context, { sourceOverride });
    if (!result.ok) {
        return result;
    }

    const toStore = {
        ...result.data,
        importedAt: new Date().toISOString(),
    };

    if (!isEncryptionAvailable()) {
        return {
            ok: false,
            errors: [ENCRYPTION_UNAVAILABLE_ERROR],
            warnings: result.warnings,
        };
    }

    const payload = encryptPayload(JSON.stringify(toStore));
    if (payload === null) {
        return {
            ok: false,
            errors: [ENCRYPTION_UNAVAILABLE_ERROR],
            warnings: result.warnings,
        };
    }

    const envelope = {
        version: 1,
        encrypted: true,
        payload,
    };

    writeStoredEnvelope(envelope);
    return {
        ok: true,
        data: toStore,
        warnings: result.warnings,
        metadata: buildPersonalContextMetadata(toStore),
    };
}

function clearPersonalContext() {
    const filePath = getPersonalContextPath();
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    return true;
}

function getPersonalContextMetadata() {
    const context = getPersonalContext();
    return buildPersonalContextMetadata(context);
}

module.exports = {
    getPersonalContext,
    setPersonalContext,
    clearPersonalContext,
    getPersonalContextMetadata,
    parsePersonalContextImport,
    buildChatGPTPersonalContextExportPrompt,
    ENCRYPTION_UNAVAILABLE_ERROR,
    isEncryptionAvailable,
};
