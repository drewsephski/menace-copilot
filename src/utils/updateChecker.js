'use strict';

const { getUpdateSource } = require('../config/updateSource');

// Electron owns download, signature verification, replacement and relaunch.
// Inject its API so native failure paths can be exercised without installing.
function createUpdateController({ app, autoUpdater, onState = () => {}, platform = process.platform, arch = process.arch }) {
    let state = { status: 'idle', localVersion: app.getVersion(), remoteVersion: null, error: null };
    let started = false;
    let busy = false;
    let interval;
    let watchdog;
    const listeners = [];
    const snapshot = () => ({ ...state });
    function publish(patch) {
        state = { ...state, ...patch };
        onState(snapshot());
    }
    function finish(patch) {
        busy = false;
        clearTimeout(watchdog);
        publish(patch);
    }
    function listen(name, listener) {
        autoUpdater.on(name, listener);
        listeners.push([name, listener]);
    }
    function start() {
        if (started) return;
        started = true;
        if (!app.isPackaged || platform !== 'darwin' || arch !== 'arm64') {
            publish({ status: 'unsupported', error: 'Automatic updates are available in the installed Apple Silicon Mac app.' });
            return;
        }
        listen('error', () => finish({ status: 'error', error: 'The update could not be checked, downloaded, or verified. Please try again.' }));
        listen('update-available', () => {
            publish({ status: 'downloading', error: null });
            armWatchdog(30 * 60 * 1000);
        });
        listen('update-not-available', () => finish({ status: 'current', error: null }));
        listen('update-downloaded', (_event, _notes, name) => {
            finish({ status: 'ready', remoteVersion: typeof name === 'string' ? name.slice(0, 100) : null, error: null });
        });
        try {
            autoUpdater.setFeedURL({ url: getUpdateSource(state.localVersion, platform, arch).feedUrl, serverType: 'default' });
        } catch {
            publish({ status: 'unsupported', error: 'The update service could not be initialized. Reinstall the latest Menace release.' });
            return;
        }
        interval = setInterval(check, 60 * 60 * 1000);
        interval.unref?.();
        check();
    }
    function armWatchdog(milliseconds) {
        clearTimeout(watchdog);
        watchdog = setTimeout(() => {
            // Native downloads cannot be canceled. Do not start a second one
            // while the first may still be running, even after the UI timeout.
            publish({ error: 'This update is taking longer than expected. Check your connection or quit and reopen Menace to retry.' });
        }, milliseconds);
        watchdog.unref?.();
    }
    function check() {
        if (!started) {
            start();
            return snapshot();
        }
        if (busy || ['unsupported', 'ready', 'installing'].includes(state.status)) return snapshot();
        busy = true;
        publish({ status: 'checking', error: null });
        armWatchdog(60 * 1000);
        try {
            autoUpdater.checkForUpdates();
        } catch {
            finish({ status: 'error', error: 'Could not start the update check. Please try again.' });
        }
        return snapshot();
    }
    function install() {
        if (state.status !== 'ready') return { success: false, error: 'No verified update is ready to install.' };
        publish({ status: 'installing', error: null });
        try {
            autoUpdater.quitAndInstall();
            return { success: true };
        } catch {
            publish({ status: 'ready', error: 'Could not restart Menace. Please try again.' });
            return { success: false, error: state.error };
        }
    }
    function dispose() {
        clearInterval(interval);
        clearTimeout(watchdog);
        for (const [name, listener] of listeners) autoUpdater.removeListener(name, listener);
    }
    return { start, check, install, snapshot, dispose };
}

module.exports = { createUpdateController };
