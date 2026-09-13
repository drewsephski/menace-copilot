'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createUpdateController } = require('../updateChecker');
const { registerUpdateIpc } = require('../updateIpc');
const { getUpdateSource } = require('../../config/updateSource');

function fixture(t, overrides = {}) {
    const native = new EventEmitter();
    let checks = 0;
    let installs = 0;
    let feed;
    native.setFeedURL = options => {
        feed = options;
    };
    native.checkForUpdates = () => {
        checks++;
    };
    native.quitAndInstall = () => {
        installs++;
    };
    const states = [];
    const controller = createUpdateController({
        app: { isPackaged: true, getVersion: () => '1.0.1' },
        autoUpdater: native,
        platform: 'darwin',
        arch: 'arm64',
        onState: state => states.push(state),
        ...overrides,
    });
    t.after(() => controller.dispose());
    return { native, controller, states, checks: () => checks, installs: () => installs, feed: () => feed };
}

test('checks once at startup, uses the fixed publisher and prevents duplicate downloads', t => {
    const f = fixture(t);
    f.controller.check();
    f.controller.start();
    f.controller.check();
    assert.equal(f.checks(), 1);
    assert.equal(f.feed().url, 'https://update.electronjs.org/drewsephski/menace-copilot/darwin-arm64/1.0.1');
    f.native.emit('update-available');
    f.controller.check();
    assert.equal(f.controller.snapshot().status, 'downloading');
    assert.equal(f.checks(), 1);
    assert.equal(f.controller.install().success, false);
    assert.equal(f.installs(), 0);
});

test('no update is visible and manual retry checks again', t => {
    const f = fixture(t);
    f.controller.start();
    f.native.emit('update-not-available');
    assert.equal(f.controller.snapshot().status, 'current');
    f.controller.check();
    assert.equal(f.checks(), 2);
});

test('only native signature-verified update-downloaded enables install, never auto-restarts', t => {
    const f = fixture(t);
    f.controller.start();
    f.native.emit('update-available');
    f.native.emit('update-downloaded', {}, 'notes', '1.0.2');
    assert.equal(f.controller.snapshot().status, 'ready');
    assert.equal(f.controller.snapshot().remoteVersion, '1.0.2');
    f.controller.check();
    assert.equal(f.checks(), 1);
    assert.equal(f.installs(), 0);
    assert.equal(f.controller.install().success, true);
    assert.equal(f.installs(), 1);
    assert.equal(f.controller.install().success, false);
});

for (const reason of ['malformed feed', 'offline', 'interrupted download', 'invalid ZIP', 'signature mismatch']) {
    test(`native ${reason} error blocks installation and permits retry`, t => {
        const f = fixture(t);
        f.controller.start();
        f.native.emit('update-available');
        f.native.emit('error', new Error(reason));
        assert.equal(f.controller.snapshot().status, 'error');
        assert.ok(f.controller.snapshot().error);
        assert.equal(f.controller.install().success, false);
        f.controller.check();
        assert.equal(f.checks(), 2);
    });
}

test('synchronous failures are surfaced and a failed restart retains the verified download', t => {
    const f = fixture(t);
    f.native.checkForUpdates = () => {
        throw new Error('offline');
    };
    f.controller.start();
    assert.equal(f.controller.snapshot().status, 'error');
    f.native.emit('update-downloaded', {}, '', '1.0.2');
    f.native.quitAndInstall = () => {
        throw new Error('restart failed');
    };
    assert.equal(f.controller.install().success, false);
    assert.equal(f.controller.snapshot().status, 'ready');
});

test('stalled checks remain single-flight until native completion', t => {
    t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
    const f = fixture(t);
    f.controller.start();
    t.mock.timers.tick(61_000);
    assert.match(f.controller.snapshot().error, /longer than expected/);
    f.controller.check();
    assert.equal(f.checks(), 1);
    f.native.emit('update-not-available');
    assert.equal(f.controller.snapshot().error, null);
});

test('hourly checks stop when an update is ready and timers/listeners are disposed', t => {
    t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
    const f = fixture(t);
    f.controller.start();
    f.native.emit('update-not-available');
    t.mock.timers.tick(3_600_000);
    assert.equal(f.checks(), 2);
    f.native.emit('update-downloaded', {}, '', '1.0.2');
    t.mock.timers.tick(3_600_000);
    assert.equal(f.checks(), 2);
    f.controller.dispose();
    assert.equal(f.native.listenerCount('update-downloaded'), 0);
});

test('development and unsupported architectures never invoke the native updater', t => {
    for (const overrides of [{ app: { isPackaged: false, getVersion: () => '1.0.1' } }, { platform: 'linux' }, { arch: 'x64' }]) {
        const f = fixture(t, overrides);
        f.controller.start();
        f.controller.check();
        assert.equal(f.controller.snapshot().status, 'unsupported');
        assert.equal(f.checks(), 0);
    }
});

test('untrusted URL/version/platform values cannot redirect the native feed', () => {
    assert.throws(() => getUpdateSource('../evil', 'darwin', 'arm64'));
    assert.throws(() => getUpdateSource('1.0.1-beta', 'darwin', 'arm64'));
    assert.throws(() => getUpdateSource('1.0.1', 'darwin/evil', 'arm64'));
});

function ipcFixture(t) {
    const f = fixture(t);
    const handlers = new Map();
    const frame = { url: require('node:url').pathToFileURL(require('node:path').resolve(__dirname, '../../index.html')).href };
    const window = { isDestroyed: () => false, webContents: { mainFrame: frame } };
    const event = { sender: window.webContents, senderFrame: frame };
    const dialog = { showMessageBox: async () => ({ response: 1 }) };
    registerUpdateIpc({ ipcMain: { handle: (name, fn) => handlers.set(name, fn) }, controller: f.controller, getWindow: () => window, dialog });
    return { ...f, handlers, event, dialog };
}

test('IPC rejects foreign windows, subframes and renderer-supplied arguments', async t => {
    const f = ipcFixture(t);
    for (const handler of f.handlers.values()) {
        assert.equal((await handler({ sender: {}, senderFrame: {} })).success, false);
        assert.equal((await handler({ ...f.event, senderFrame: {} })).success, false);
        assert.equal((await handler(f.event, 'https://evil.invalid/update')).success, false);
    }
    assert.equal(f.checks(), 0);
    assert.equal(f.installs(), 0);
});

test('restart requires a verified download and explicit confirmation; Later preserves readiness', async t => {
    const f = ipcFixture(t);
    const install = f.handlers.get('app:install-update');
    assert.equal((await install(f.event)).success, false);
    f.controller.start();
    f.native.emit('update-downloaded', {}, '', '1.0.2');
    assert.equal((await install(f.event)).canceled, true);
    assert.equal(f.controller.snapshot().status, 'ready');
    assert.equal(f.installs(), 0);
    f.dialog.showMessageBox = async (_window, options) => {
        assert.equal(options.defaultId, 1);
        assert.equal(options.cancelId, 1);
        return { response: 0 };
    };
    assert.equal((await install(f.event)).success, true);
    assert.equal(f.installs(), 1);
});

test('concurrent restart clicks cannot open two dialogs', async t => {
    const f = ipcFixture(t);
    f.controller.start();
    f.native.emit('update-downloaded', {}, '', '1.0.2');
    let resolve;
    f.dialog.showMessageBox = () =>
        new Promise(r => {
            resolve = r;
        });
    const install = f.handlers.get('app:install-update');
    const pending = install(f.event);
    assert.equal((await install(f.event)).success, false);
    resolve({ response: 1 });
    await pending;
});

test('storage initialization after a desktop version bump retains settings, encrypted license and history', t => {
    const fs = require('node:fs');
    const os = require('node:os');
    const path = require('node:path');
    const storage = require('../../storage');
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'menace-updater-data-'));
    const previous = { NODE_ENV: process.env.NODE_ENV, MENACE_TEST_CONFIG_DIR: process.env.MENACE_TEST_CONFIG_DIR };
    process.env.NODE_ENV = 'test';
    process.env.MENACE_TEST_CONFIG_DIR = directory;
    t.after(() => {
        for (const [key, value] of Object.entries(previous)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
        fs.rmSync(directory, { recursive: true, force: true });
    });
    storage.initializeStorage();
    storage.updateConfig('onboarded', true);
    storage.updateConfig('openrouterModel', 'custom/model');
    const credentials = JSON.stringify({ secretsEncrypted: true, licenseKey: '__enc__:synthetic-test-only', licenseActivationId: '__enc__:synthetic-id' });
    fs.writeFileSync(path.join(directory, 'credentials.json'), credentials);
    fs.writeFileSync(path.join(directory, 'history', 'session.json'), '{"answer":"preserved"}');
    storage.initializeStorage();
    assert.equal(storage.getConfig().onboarded, true);
    assert.equal(storage.getConfig().openrouterModel, 'custom/model');
    assert.equal(fs.readFileSync(path.join(directory, 'credentials.json'), 'utf8'), credentials);
    assert.equal(fs.readFileSync(path.join(directory, 'history', 'session.json'), 'utf8'), '{"answer":"preserved"}');
});
