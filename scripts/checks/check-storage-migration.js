'use strict';

function mockElectronSafeStorage() {
    const electronPath = require.resolve('electron');
    require.cache[electronPath] = {
        id: electronPath,
        filename: electronPath,
        loaded: true,
        exports: {
            safeStorage: {
                isEncryptionAvailable: () => false,
                encryptString: value => Buffer.from(String(value)),
                decryptString: buffer => buffer.toString(),
            },
        },
    };
}

function main() {
    mockElectronSafeStorage();

    const storage = require('../../src/storage');
    const secure = require('../../src/utils/secureCredentials');

    const normalized = storage.normalizeStoredProfileId('exam');
    if (normalized !== 'custom') {
        throw new Error('storage.normalizeStoredProfileId(exam) should return custom');
    }

    const encrypted = secure.encryptCredentialFields({
        apiKey: 'test-key',
        openrouterApiKey: 'or-key',
        licenseKey: 'lic',
        licenseActivationId: 'act',
        licenseValidatedAt: 0,
    });

    const decrypted = secure.decryptCredentialFields(encrypted);
    if (decrypted.apiKey !== 'test-key' || decrypted.openrouterApiKey !== 'or-key') {
        throw new Error('Credential encrypt/decrypt round-trip failed');
    }

    console.log('Storage migration and credential helpers OK');
}

try {
    main();
} catch (error) {
    console.error('Storage migration check failed:', error.message);
    process.exit(1);
}
