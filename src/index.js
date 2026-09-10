if (require('electron-squirrel-startup')) {
    process.exit(0);
}

require('./utils/loadEnv').loadEnv();

const { app, BrowserWindow, shell, ipcMain } = require('electron');
const { createWindow, updateGlobalShortcuts, applyWindowLayer } = require('./utils/window');
const { checkForUpdates, getReleasePageUrl } = require('./utils/updateChecker');
const { setupGeminiIpcHandlers, stopMacOSAudioCapture, sendToRenderer } = require('./utils/gemini');
const storage = require('./storage');
const polar = require('./utils/polar');
const { isAllowedExternalUrl } = require('./utils/externalUrl');
const { getOpenRouterAccess, getUserOpenRouterApiKey, syncLicensedHostedAccess } = require('./utils/openrouterCredentials');

const geminiSessionRef = { current: null };
let mainWindow = null;

function openExternalWithoutBlocking(url) {
    void shell.openExternal(url).catch(error => {
        console.error('Error opening external URL:', error);
    });
}

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
    setupPersonalContextIpcHandlers();
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
            const creds = storage.getCredentials();
            return {
                success: true,
                data: {
                    hasApiKey: Boolean(creds.apiKey?.trim()),
                    hasOpenRouterApiKey: Boolean(creds.openrouterApiKey?.trim()),
                    hasCloudToken: Boolean(creds.cloudToken?.trim()),
                    hasOpenaiKey: Boolean(creds.openaiKey?.trim()),
                    licenseValidatedAt: creds.licenseValidatedAt || 0,
                },
            };
        } catch (error) {
            console.error('Error getting credentials:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:set-credentials', async (event, credentials) => {
        try {
            if (!credentials || typeof credentials !== 'object') {
                return { success: false, error: 'Invalid credentials payload' };
            }

            const updates = {};
            if (typeof credentials.cloudToken === 'string') {
                updates.cloudToken = credentials.cloudToken;
            }
            if (typeof credentials.openaiKey === 'string') {
                updates.openaiKey = credentials.openaiKey;
            }

            if (Object.keys(updates).length === 0) {
                return { success: false, error: 'No supported credential fields provided' };
            }

            storage.setCredentials(updates);
            return { success: true };
        } catch (error) {
            console.error('Error setting credentials:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('credentials:get-key-status', async () => {
        try {
            const geminiKey = storage.getApiKey();
            const openrouterKey = getUserOpenRouterApiKey();
            return {
                success: true,
                data: {
                    hasGeminiKey: Boolean(geminiKey && geminiKey.trim()),
                    hasOpenRouterKey: Boolean(openrouterKey && openrouterKey.trim()),
                },
            };
        } catch (error) {
            console.error('Error getting credential status:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('credentials:set-api-key', async (event, apiKey) => {
        try {
            if (typeof apiKey !== 'string') {
                return { success: false, error: 'Invalid API key' };
            }
            storage.setApiKey(apiKey);
            return { success: true };
        } catch (error) {
            console.error('Error setting API key:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('credentials:set-openrouter-api-key', async (event, openrouterApiKey) => {
        try {
            if (typeof openrouterApiKey !== 'string') {
                return { success: false, error: 'Invalid API key' };
            }
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
            if (key === 'windowLayer' && mainWindow && !mainWindow.isDestroyed()) {
                applyWindowLayer(mainWindow);
            }
            return { success: true };
        } catch (error) {
            console.error('Error updating preference:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:get-profile-context', async (event, profileId) => {
        try {
            return { success: true, data: storage.getProfileContext(profileId) };
        } catch (error) {
            console.error('Error getting profile context:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('storage:set-profile-context', async (event, profileId, context) => {
        try {
            storage.setProfileContext(profileId, context);
            return { success: true };
        } catch (error) {
            console.error('Error setting profile context:', error);
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

function setupPersonalContextIpcHandlers() {
    const personalContextStorage = require('./utils/personalContextStorage');

    ipcMain.handle('personal-context:get-metadata', async () => {
        try {
            return { success: true, data: personalContextStorage.getPersonalContextMetadata() };
        } catch (error) {
            console.error('Error getting personal context metadata:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('personal-context:get', async () => {
        try {
            const context = personalContextStorage.getPersonalContext();
            return { success: true, data: context };
        } catch (error) {
            console.error('Error getting personal context:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('personal-context:set', async (event, context, options = {}) => {
        try {
            const result = personalContextStorage.setPersonalContext(context, options);
            if (!result.ok) {
                return {
                    success: false,
                    errors: result.errors,
                    error: result.errors?.[0] || 'Could not save personal context.',
                    warnings: result.warnings || [],
                };
            }
            return { success: true, data: result.metadata, warnings: result.warnings || [] };
        } catch (error) {
            console.error('Error setting personal context:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('personal-context:clear', async () => {
        try {
            personalContextStorage.clearPersonalContext();
            return { success: true };
        } catch (error) {
            console.error('Error clearing personal context:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('personal-context:parse-import', async (event, text, options = {}) => {
        try {
            const result = personalContextStorage.parsePersonalContextImport(text, options);
            if (!result.ok) {
                return { success: false, errors: result.errors, warnings: result.warnings || [] };
            }
            return {
                success: true,
                data: result.data,
                metadata: result.metadata,
                warnings: result.warnings || [],
            };
        } catch (error) {
            console.error('Error parsing personal context import:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('personal-context:get-import-prompt', async () => {
        try {
            return { success: true, data: personalContextStorage.buildChatGPTPersonalContextExportPrompt() };
        } catch (error) {
            console.error('Error building import prompt:', error);
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
            openExternalWithoutBlocking(polar.getCustomerPortalUrl());
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

            openExternalWithoutBlocking(result.url);
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

    ipcMain.handle('app:check-updates', async () => {
        try {
            const result = await checkForUpdates();
            return { success: true, data: result };
        } catch (error) {
            console.error('Error checking for updates:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('app:open-update', async () => {
        try {
            const releaseUrl = getReleasePageUrl();
            if (!releaseUrl) {
                return { success: false, error: 'No release page configured' };
            }

            openExternalWithoutBlocking(releaseUrl);
            return { success: true };
        } catch (error) {
            console.error('Error opening update page:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('app:get-session-readiness', async () => {
        try {
            const fs = require('fs');
            const path = require('path');
            const { app } = require('electron');
            const prefs = storage.getPreferences();
            const license = await polar.getLicenseStatus();
            const access = getOpenRouterAccess();

            let screen = { state: 'unknown', label: 'Unknown' };
            if (process.platform === 'darwin') {
                const { systemPreferences } = require('electron');
                const status = systemPreferences.getMediaAccessStatus('screen');
                if (status === 'granted') {
                    screen = { state: 'ready', label: 'Ready' };
                } else if (status === 'denied' || status === 'restricted') {
                    screen = { state: 'denied', label: 'Denied' };
                } else {
                    screen = { state: 'pending', label: 'Needs permission' };
                }
            } else {
                screen = { state: 'unknown', label: 'Grant on first capture' };
            }

            let audio = { state: 'unknown', label: 'Unknown' };
            const whisperModel = prefs.whisperModel || '';
            if (!whisperModel) {
                audio = { state: 'needs-setup', label: 'Needs setup' };
            } else if (process.platform === 'darwin') {
                const helperPath = app.isPackaged
                    ? path.join(process.resourcesPath, '..', 'Helpers', 'SystemAudioDump')
                    : path.join(__dirname, 'assets', 'SystemAudioDump');
                audio = fs.existsSync(helperPath) ? { state: 'configured', label: 'Configured' } : { state: 'unavailable', label: 'Helper missing' };
            } else {
                audio = { state: 'configured', label: 'Configured' };
            }

            if ((prefs.audioMode === 'mic_only' || prefs.audioMode === 'both') && process.platform === 'darwin') {
                const { systemPreferences } = require('electron');
                const micStatus = systemPreferences.getMediaAccessStatus('microphone');
                if (micStatus !== 'granted') {
                    audio = { state: 'pending', label: 'Needs mic permission' };
                }
            }

            let ai = { state: 'needs-license', label: 'Needs pass' };
            if (license.valid && license.includedAi) {
                if (license.hostedAi) {
                    ai = { state: 'ready', label: 'Included AI' };
                } else if (access.source === 'hosted-unconfigured') {
                    ai = { state: 'unavailable', label: 'Gateway not deployed' };
                } else {
                    ai = { state: 'ready', label: 'Included AI' };
                }
            } else if (license.valid && access.available) {
                ai = { state: 'configured', label: 'Configured' };
            } else if (license.valid && license.requiresApiKeys) {
                ai = { state: 'needs-keys', label: 'Needs keys' };
            }

            return { success: true, data: { audio, screen, ai } };
        } catch (error) {
            console.error('Error getting session readiness:', error);
            return { success: false, error: error.message };
        }
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
            if (!isAllowedExternalUrl(url)) {
                return { success: false, error: 'Invalid URL' };
            }

            openExternalWithoutBlocking(url);
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

    // Opt-in transport debugging from renderer (never logs auth tokens by default)
    ipcMain.on('log-message', (event, msg) => {
        if (process.env.MENACE_DEBUG_TRANSPORT === '1') {
            const safe =
                typeof msg === 'string'
                    ? msg.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]').replace(/token=[^&\s]+/gi, 'token=[redacted]')
                    : msg;
            console.log(safe);
        }
    });
}
