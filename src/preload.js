'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const INVOKE_CHANNELS = new Set([
    'storage:get-config',
    'storage:set-config',
    'storage:update-config',
    'storage:get-credentials',
    'storage:set-credentials',
    'storage:get-preferences',
    'storage:set-preferences',
    'storage:update-preference',
    'storage:get-profile-context',
    'storage:set-profile-context',
    'storage:get-keybinds',
    'storage:set-keybinds',
    'storage:get-all-sessions',
    'storage:get-session',
    'storage:save-session',
    'storage:delete-session',
    'storage:delete-all-sessions',
    'storage:get-today-limits',
    'storage:clear-all',
    'credentials:get-key-status',
    'credentials:set-api-key',
    'credentials:set-openrouter-api-key',
    'openrouter:get-access',
    'polar:get-status',
    'polar:activate',
    'polar:clear',
    'polar:open-portal',
    'polar:open-checkout',
    'get-app-version',
    'app:get-session-readiness',
    'app:check-updates',
    'app:open-update',
    'quit-application',
    'open-external',
    'window-minimize',
    'refresh-display-media-handler',
    'toggle-window-visibility',
    'initialize-cloud',
    'initialize-gemini',
    'initialize-local',
    'initialize-whisper-openrouter',
    'cancel-local-initialization',
    'send-audio-content',
    'send-mic-audio-content',
    'send-image-content',
    'send-text-message',
    'start-macos-audio',
    'stop-macos-audio',
    'close-session',
    'get-current-session',
    'start-new-session',
    'update-google-search-setting',
]);

const SEND_CHANNELS = new Set(['update-keybinds', 'view-changed', 'log-message']);

const ON_CHANNELS = new Set([
    'new-response',
    'update-response',
    'update-status',
    'click-through-toggled',
    'reconnect-failed',
    'whisper-downloading',
    'local-ai-download-progress',
    'save-conversation-turn',
    'save-session-context',
    'save-screen-analysis',
    'clear-sensitive-data',
    'navigate-previous-response',
    'navigate-next-response',
    'scroll-response-up',
    'scroll-response-down',
    'handle-shortcut',
    'session-initializing',
]);

function assertAllowed(channel, allowed) {
    if (!allowed.has(channel)) {
        throw new Error(`Blocked IPC channel: ${channel}`);
    }
}

function invoke(channel, ...args) {
    assertAllowed(channel, INVOKE_CHANNELS);
    return ipcRenderer.invoke(channel, ...args);
}

function send(channel, ...args) {
    assertAllowed(channel, SEND_CHANNELS);
    ipcRenderer.send(channel, ...args);
}

function on(channel, listener) {
    assertAllowed(channel, ON_CHANNELS);
    if (typeof listener !== 'function') {
        throw new Error('IPC listener must be a function');
    }
    const wrapper = (_event, ...payload) => listener(...payload);
    ipcRenderer.on(channel, wrapper);
    return () => ipcRenderer.removeListener(channel, wrapper);
}

const menace = {
    platform: process.platform,

    app: {
        getVersion: () => invoke('get-app-version'),
        checkUpdates: () => invoke('app:check-updates'),
        openUpdate: () => invoke('app:open-update'),
        getSessionReadiness: () => invoke('app:get-session-readiness'),
        quit: () => invoke('quit-application'),
        openExternal: url => invoke('open-external', url),
    },

    license: {
        getStatus: () => invoke('polar:get-status'),
        activate: key => invoke('polar:activate', key),
        clear: () => invoke('polar:clear'),
        openCheckout: sku => invoke('polar:open-checkout', sku),
        openPortal: () => invoke('polar:open-portal'),
    },

    preferences: {
        get: () => invoke('storage:get-preferences'),
        set: preferences => invoke('storage:set-preferences', preferences),
        update: (key, value) => invoke('storage:update-preference', key, value),
        getProfileContext: profileId => invoke('storage:get-profile-context', profileId),
        setProfileContext: (profileId, context) => invoke('storage:set-profile-context', profileId, context),
    },

    credentials: {
        getKeyStatus: () => invoke('credentials:get-key-status'),
        setApiKey: apiKey => invoke('credentials:set-api-key', apiKey),
        setOpenRouterApiKey: apiKey => invoke('credentials:set-openrouter-api-key', apiKey),
        getOpenRouterAccess: () => invoke('openrouter:get-access'),
    },

    session: {
        initializeGemini: (customPrompt, profile, language) => invoke('initialize-gemini', customPrompt, profile, language),
        initializeLocal: (localLlmModel, whisperModel, profile, customPrompt) =>
            invoke('initialize-local', localLlmModel, whisperModel, profile, customPrompt),
        initializeWhisperOpenRouter: (whisperModel, profile, customPrompt) =>
            invoke('initialize-whisper-openrouter', whisperModel, profile, customPrompt),
        cancelLocalInitialization: () => invoke('cancel-local-initialization'),
        initializeCloud: (profile, customPrompt) => invoke('initialize-cloud', profile, customPrompt),
        sendAudio: payload => invoke('send-audio-content', payload),
        sendMicAudio: payload => invoke('send-mic-audio-content', payload),
        sendImage: payload => invoke('send-image-content', payload),
        sendText: text => invoke('send-text-message', text),
        startMacosAudio: () => invoke('start-macos-audio'),
        stopMacosAudio: () => invoke('stop-macos-audio'),
        close: () => invoke('close-session'),
        getCurrent: () => invoke('get-current-session'),
        startNew: () => invoke('start-new-session'),
        updateGoogleSearchSetting: enabled => invoke('update-google-search-setting', enabled),
    },

    window: {
        minimize: () => invoke('window-minimize'),
        toggleVisibility: () => invoke('toggle-window-visibility'),
        refreshDisplayMediaHandler: () => invoke('refresh-display-media-handler'),
        onViewChanged: view => send('view-changed', view),
        onKeybindsChanged: keybinds => send('update-keybinds', keybinds),
    },

    events: {
        on,
    },
};

contextBridge.exposeInMainWorld('menace', menace);

contextBridge.exposeInMainWorld('menaceElectron', {
    platform: process.platform,
    invoke,
    send,
    on,
    removeAllListeners(channel) {
        assertAllowed(channel, ON_CHANNELS);
        ipcRenderer.removeAllListeners(channel);
    },
});
