'use strict';

const { pathToFileURL } = require('node:url');
const path = require('node:path');
const APP_URL = pathToFileURL(path.resolve(__dirname, '../index.html')).href;

function registerUpdateIpc({ ipcMain, controller, getWindow, dialog }) {
    let confirming = false;
    function trusted(event, args) {
        const window = getWindow();
        return Boolean(
            window &&
                !window.isDestroyed() &&
                event.sender === window.webContents &&
                event.senderFrame === window.webContents.mainFrame &&
            event.senderFrame.url === APP_URL &&
                args.length === 0
        );
    }
    for (const [channel, action] of [
        ['app:get-update-status', () => controller.snapshot()],
        ['app:check-updates', () => controller.check()],
    ]) {
        ipcMain.handle(channel, (event, ...args) => {
            if (!trusted(event, args)) return { success: false, error: 'Invalid update request.' };
            return { success: true, data: action() };
        });
    }
    ipcMain.handle('app:install-update', async (event, ...args) => {
        if (!trusted(event, args)) return { success: false, error: 'Invalid update request.' };
        if (confirming) return { success: false, error: 'A restart choice is already open.' };
        if (controller.snapshot().status !== 'ready') return { success: false, error: 'No verified update is ready to install.' };
        confirming = true;
        try {
            const { response } = await dialog.showMessageBox(getWindow(), {
                type: 'info',
                title: 'Update Menace Agent',
                message: 'Restart to install the update?',
                detail: 'Restarting ends any active conversation. Your saved history, settings, and license will be kept.',
                buttons: ['Restart to update', 'Later'],
                defaultId: 1,
                cancelId: 1,
                noLink: true,
            });
            return response === 0 ? controller.install() : { success: true, canceled: true };
        } catch {
            return { success: false, error: 'Could not open the restart dialog. Please try again.' };
        } finally {
            confirming = false;
        }
    });
}

module.exports = { registerUpdateIpc };
