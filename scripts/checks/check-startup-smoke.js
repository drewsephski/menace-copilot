'use strict';

function mockElectron() {
    const electronPath = require.resolve('electron');
    require.cache[electronPath] = {
        id: electronPath,
        filename: electronPath,
        loaded: true,
        exports: {
            app: { getVersion: () => '1.0.0' },
            contextBridge: {
                exposeInMainWorld: () => {},
            },
            ipcRenderer: {
                invoke: async () => ({}),
                send: () => {},
                on: () => {},
                removeListener: () => {},
                removeAllListeners: () => {},
            },
            safeStorage: {
                isEncryptionAvailable: () => false,
                encryptString: value => Buffer.from(String(value)),
                decryptString: buffer => buffer.toString(),
            },
        },
    };
}

function main() {
    mockElectron();

    require('../../src/config/updateSource');
    require('../../src/config/releaseSource');
    require('../../src/utils/updateChecker');
    require('../../src/utils/secureCredentials');
    require('../../src/utils/prompts');
    require('../../src/storage');

    const preloadPath = require('path').join(__dirname, '..', '..', 'src', 'preload.js');
    require(preloadPath);

    console.log('Startup smoke: core main-process modules load OK');
}

try {
    main();
} catch (error) {
    console.error('Startup smoke check failed:', error.message);
    console.error(error.stack);
    process.exit(1);
}
