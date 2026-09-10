'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const INVOKE_CHANNELS = new Set([
    'storage:get-config',
    'storage:set-config',
    'storage:update-config',
    'storage:get-credentials',
    'storage:set-credentials',
    'storage:get-api-key',
    'storage:set-api-key',
    'storage:get-openrouter-api-key',
    'storage:set-openrouter-api-key',
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
]);

function assertAllowed(channel, allowed) {
    if (!allowed.has(channel)) {
        throw new Error(`Blocked IPC channel: ${channel}`);
    }
}

contextBridge.exposeInMainWorld('menaceElectron', {
    platform: process.platform,

    invoke(channel, ...args) {
        assertAllowed(channel, INVOKE_CHANNELS);
        return ipcRenderer.invoke(channel, ...args);
    },

    send(channel, ...args) {
        assertAllowed(channel, SEND_CHANNELS);
        ipcRenderer.send(channel, ...args);
    },

    on(channel, listener) {
        assertAllowed(channel, ON_CHANNELS);
        if (typeof listener !== 'function') {
            throw new Error('IPC listener must be a function');
        }
        const wrapper = (_event, ...payload) => listener(...payload);
        ipcRenderer.on(channel, wrapper);
        return () => ipcRenderer.removeListener(channel, wrapper);
    },

    removeAllListeners(channel) {
        assertAllowed(channel, ON_CHANNELS);
        ipcRenderer.removeAllListeners(channel);
    },
});
