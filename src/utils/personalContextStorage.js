'use strict';

const fs = require('fs');
const path = require('path');
const { safeStorage } = require('electron');
const { getConfigDir } = require('../storage');
const {
    validateAndNormalizePersonalContext,
    buildPersonalContextMetadata,
    parsePersonalContextImport,
} = require('./personalContext/schema');
const { buildChatGPTPersonalContextExportPrompt } = require('./personalContext/importPrompt');

const ENCRYPTED_PREFIX = '__enc__:';

function getPersonalContextPath() {
    return path.join(getConfigDir(), 'personal-context.json');
}

function isEncryptionAvailable() {
    try {
        return safeStorage.isEncryptionAvailable();
    } catch {
        return false;
    }
}

function encryptPayload(plaintext) {
    if (typeof plaintext !== 'string' || plaintext.length === 0) {
        return '';
    }

    if (!isEncryptionAvailable()) {
        return plaintext;
    }

    const encrypted = safeStorage.encryptString(plaintext);
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
        const buffer = Buffer.from(stored.slice(ENCRYPTED_PREFIX.length), 'base64');
        return safeStorage.decryptString(buffer);
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

    const envelope = {
        version: 1,
        encrypted: isEncryptionAvailable(),
        payload: encryptPayload(JSON.stringify(toStore)),
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
};
