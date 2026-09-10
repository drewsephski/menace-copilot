if (require('electron-squirrel-startup')) {
    process.exit(0);
}

require('./utils/loadEnv').loadEnv();

const { app, BrowserWindow, shell, ipcMain } = require('electron');
const { createWindow, updateGlobalShortcuts } = require('./utils/window');
const { setupGeminiIpcHandlers, stopMacOSAudioCapture, sendToRenderer } = require('./utils/gemini');
const storage = require('./storage');
const polar = require('./utils/polar');
const { isAllowedPolarUrl } = require('./utils/polarConfig');
const { getOpenRouterAccess, getUserOpenRouterApiKey, syncLicensedHostedAccess } = require('./utils/openrouterCredentials');

const geminiSessionRef = { current: null };
let mainWindow = null;

function createMainWindow() {
    mainWindow = createWindow(sendToRenderer, geminiSessionRef);
    return mainWindow;
}

app.whenReady().then(async () => {
    // Initialize storage (checks version, resets if needed)
    storage.initializeStorage();

    if (process.platform === 'darwin') {
        const { desktopCapturer, systemPreferences } = require('electron');

        try {
            const screenStatus = systemPreferences.getMediaAccessStatus('screen');
            const config = storage.getConfig();

            if (!config.onboarded && screenStatus !== 'granted') {
                desktopCapturer.getSources({ types: ['screen'] }).catch(() => {});
            }

            if (screenStatus !== 'granted') {
                console.warn(
                    'macOS screen/system-audio access is not granted for this process.',
                    'Enable Electron (or Menace Agent) under System Settings → Privacy & Security → Screen & System Audio Recording,',
                    'and on macOS 26+ also under System Audio Recording Only.'
                );
            }
        } catch (error) {
            console.warn('Unable to check macOS media access status:', error.message);
        }
    }

    createMainWindow();
    setupGeminiIpcHandlers(geminiSessionRef);
    setupStorageIpcHandlers();
    setupOpenRouterIpcHandlers();
    setupPolarIpcHandlers();
    setupGeneralIpcHandlers();

    polar
        .getLicenseStatus()
        .then(syncLicensedHostedAccess)
        .catch(error => console.warn('Could not sync hosted AI access:', error.message));
});

app.on('window-all-closed', () => {
    stopMacOSAudioCapture();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    stopMacOSAudioCapture();
    require('./utils/localai').closeLocalSession();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

function setupStorageIpcHandlers() {
    // ============ CONFIG ============
    ipcMain.handle('storage:get-config', async () => {
        try {
            return { success: true, data: storage.getConfig() };
        } catch (error) {
            console.error('Error getting config:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:set-config', async (event, config) => {
        try {
            storage.setConfig(config);
            return { success: true };
        } catch (error) {
            console.error('Error setting config:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:update-config', async (event, key, value) => {
        try {
            storage.updateConfig(key, value);
            return { success: true };
        } catch (error) {
            console.error('Error updating config:', error);
            return { success: false, error: error.message };
        }
    });

    // ============ CREDENTIALS ============
    ipcMain.handle('storage:get-credentials', async () => {
        try {
            return { success: true, data: storage.getCredentials() };
        } catch (error) {
            console.error('Error getting credentials:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:set-credentials', async (event, credentials) => {
        try {
            storage.setCredentials(credentials);
            return { success: true };
        } catch (error) {
            console.error('Error setting credentials:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:get-api-key', async () => {
        try {
            return { success: true, data: storage.getApiKey() };
        } catch (error) {
            console.error('Error getting API key:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:set-api-key', async (event, apiKey) => {
        try {
            storage.setApiKey(apiKey);
            return { success: true };
        } catch (error) {
            console.error('Error setting API key:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:get-openrouter-api-key', async () => {
        try {
            return { success: true, data: getUserOpenRouterApiKey() };
        } catch (error) {
            console.error('Error getting OpenRouter API key:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:set-openrouter-api-key', async (event, openrouterApiKey) => {
        try {
            storage.setOpenRouterApiKey(openrouterApiKey);
            return { success: true };
        } catch (error) {
            console.error('Error setting OpenRouter API key:', error);
            return { success: false, error: error.message };
        }
    });

    // ============ PREFERENCES ============
    ipcMain.handle('storage:get-preferences', async () => {
        try {
            return { success: true, data: storage.getPreferences() };
        } catch (error) {
            console.error('Error getting preferences:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:set-preferences', async (event, preferences) => {
        try {
            storage.setPreferences(preferences);
            return { success: true };
        } catch (error) {
            console.error('Error setting preferences:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:update-preference', async (event, key, value) => {
        try {
            storage.updatePreference(key, value);
            return { success: true };
        } catch (error) {
            console.error('Error updating preference:', error);
            return { success: false, error: error.message };
        }
    });

    // ============ KEYBINDS ============
    ipcMain.handle('storage:get-keybinds', async () => {
        try {
            return { success: true, data: storage.getKeybinds() };
        } catch (error) {
            console.error('Error getting keybinds:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:set-keybinds', async (event, keybinds) => {
        try {
            storage.setKeybinds(keybinds);
            return { success: true };
        } catch (error) {
            console.error('Error setting keybinds:', error);
            return { success: false, error: error.message };
        }
    });

    // ============ HISTORY ============
    ipcMain.handle('storage:get-all-sessions', async () => {
        try {
            return { success: true, data: storage.getAllSessions() };
        } catch (error) {
            console.error('Error getting sessions:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:get-session', async (event, sessionId) => {
        try {
            return { success: true, data: storage.getSession(sessionId) };
        } catch (error) {
            console.error('Error getting session:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:save-session', async (event, sessionId, data) => {
        try {
            storage.saveSession(sessionId, data);
            return { success: true };
        } catch (error) {
            console.error('Error saving session:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:delete-session', async (event, sessionId) => {
        try {
            storage.deleteSession(sessionId);
            return { success: true };
        } catch (error) {
            console.error('Error deleting session:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:delete-all-sessions', async () => {
        try {
            storage.deleteAllSessions();
            return { success: true };
        } catch (error) {
            console.error('Error deleting all sessions:', error);
            return { success: false, error: error.message };
        }
    });

    // ============ LIMITS ============
    ipcMain.handle('storage:get-today-limits', async () => {
        try {
            return { success: true, data: storage.getTodayLimits() };
        } catch (error) {
            console.error('Error getting today limits:', error);
            return { success: false, error: error.message };
        }
    });

    // ============ CLEAR ALL ============
    ipcMain.handle('storage:clear-all', async () => {
        try {
            storage.clearAllData();
            return { success: true };
        } catch (error) {
            console.error('Error clearing all data:', error);
            return { success: false, error: error.message };
        }
    });
}

function setupOpenRouterIpcHandlers() {
    ipcMain.handle('openrouter:get-access', async () => {
        try {
            return { success: true, data: getOpenRouterAccess() };
        } catch (error) {
            console.error('Error resolving OpenRouter access:', error);
            return { success: false, error: error.message };
        }
    });
}

function setupPolarIpcHandlers() {
    ipcMain.handle('polar:get-status', async () => {
        try {
            return { success: true, data: await polar.getLicenseStatus() };
        } catch (error) {
            console.error('Error checking Polar license:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('polar:activate', async (event, rawKey) => {
        try {
            if (typeof rawKey !== 'string') {
                return { success: false, error: 'Enter a valid license key.' };
            }
            return await polar.activateLicense(rawKey);
        } catch (error) {
            console.error('Error activating Polar license:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('polar:clear', async () => {
        try {
            return { success: true, data: polar.clearLicense() };
        } catch (error) {
            console.error('Error clearing Polar license:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('polar:open-portal', async () => {
        try {
            await shell.openExternal(polar.getCustomerPortalUrl());
            return { success: true };
        } catch (error) {
            console.error('Error opening Polar customer portal:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('polar:open-checkout', async (event, sku) => {
        try {
            if (typeof sku !== 'string') {
                return { success: false, error: 'Unknown plan.' };
            }

            const result = polar.getCheckoutUrl(sku);
            if (!result.success) {
                return result;
            }

            await shell.openExternal(result.url);
            return { success: true };
        } catch (error) {
            console.error('Error opening Polar checkout:', error);
            return { success: false, error: error.message };
        }
    });
}

function setupGeneralIpcHandlers() {
    ipcMain.handle('get-app-version', async () => {
        return app.getVersion();
    });

    ipcMain.handle('quit-application', async event => {
        try {
            stopMacOSAudioCapture();
            app.quit();
            return { success: true };
        } catch (error) {
            console.error('Error quitting application:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('open-external', async (event, url) => {
        try {
            if (typeof url !== 'string' || url.length > 2048) {
                return { success: false, error: 'Invalid URL' };
            }

            let parsed;
            try {
                parsed = new URL(url);
            } catch {
                return { success: false, error: 'Invalid URL' };
            }

            const allowedProtocols = new Set(['https:', 'http:', 'mailto:', 'x-apple.systempreferences:']);
            if (!allowedProtocols.has(parsed.protocol) && !isAllowedPolarUrl(url)) {
                return { success: false, error: 'URL scheme not allowed' };
            }

            await shell.openExternal(url);
            return { success: true };
        } catch (error) {
            console.error('Error opening external URL:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.on('update-keybinds', (event, newKeybinds) => {
        if (mainWindow) {
            // Also save to storage
            storage.setKeybinds(newKeybinds);
            updateGlobalShortcuts(newKeybinds, mainWindow, sendToRenderer, geminiSessionRef);
        }
    });

    // Debug logging from renderer
    ipcMain.on('log-message', (event, msg) => {
        console.log(msg);
    });
}
