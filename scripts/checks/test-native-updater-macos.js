'use strict';

// Explicit integration test: builds isolated signed fixtures and exercises the
// real Squirrel engine. Never uses the user's installed app or settings.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn, execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');

async function main() {
    if (process.platform !== 'darwin' || process.arch !== 'arm64') throw new Error('Requires an Apple Silicon Mac');
    const root = path.resolve(__dirname, '../..');
    const work = fs.mkdtempSync(path.join(os.tmpdir(), 'menace-native-update-'));
    const resultPath = path.join(work, 'result.json');
    const eventsPath = path.join(work, 'events.jsonl');
    const dataPath = path.join(work, 'settings.json');
    fs.writeFileSync(dataPath, JSON.stringify({ history: ['preserved'], license: 'synthetic-fixture-only' }));
    const originalData = fs.readFileSync(dataPath, 'utf8');
    const identity = 'Developer ID Application: ANDREW DOUGLAS SEPECZI (2NHJGX6A7S)';
    const run = (command, args) => execFileSync(command, args, { stdio: 'pipe' });
    let feedRequests = 0;
    const server = http.createServer((req, res) => {
        if (req.url === '/feed') {
            feedRequests++;
            if (feedRequests === 1) { res.writeHead(204); res.end(); return; }
            const artifact = feedRequests === 2 ? 'broken.zip' : feedRequests === 3 ? 'untrusted.zip' : 'update.zip';
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ url: `http://127.0.0.1:${server.address().port}/${artifact}`, name: '1.0.2', notes: 'Native integration test', pub_date: new Date().toISOString() }));
            return;
        }
        const artifact = { '/broken.zip': 'broken.zip', '/untrusted.zip': 'untrusted.zip', '/update.zip': 'update.zip' }[req.url];
        if (!artifact) { res.writeHead(404); res.end(); return; }
        const file = path.join(work, artifact);
        res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Length': fs.statSync(file).size });
        fs.createReadStream(file).pipe(res);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let child;
    try {
        const port = server.address().port;
        function makeBundle(folder, version, mainSource, signingIdentity) {
            const appPath = path.join(work, folder, 'Menace Updater Test.app');
            fs.mkdirSync(path.dirname(appPath), { recursive: true });
            run('ditto', [path.join(root, 'node_modules/electron/dist/Electron.app'), appPath]);
            const resources = path.join(appPath, 'Contents/Resources');
            fs.rmSync(path.join(resources, 'default_app.asar'), { force: true });
            const source = path.join(resources, 'app');
            fs.mkdirSync(path.join(source, 'src/config'), { recursive: true });
            fs.mkdirSync(path.join(source, 'src/utils'), { recursive: true });
            fs.copyFileSync(path.join(root, 'src/config/updateSource.js'), path.join(source, 'src/config/updateSource.js'));
            fs.copyFileSync(path.join(root, 'src/utils/updateChecker.js'), path.join(source, 'src/utils/updateChecker.js'));
            fs.writeFileSync(path.join(source, 'package.json'), JSON.stringify({ name: 'menace-native-update-test', version, main: 'main.js' }));
            fs.writeFileSync(path.join(source, 'main.js'), mainSource);
            fs.renameSync(path.join(appPath, 'Contents/MacOS/Electron'), path.join(appPath, 'Contents/MacOS/Menace Updater Test'));
            const plist = path.join(appPath, 'Contents/Info.plist');
            for (const [key, value] of Object.entries({ CFBundleExecutable: 'Menace Updater Test', CFBundleIdentifier: 'com.menaceagent.updater-integration-test', CFBundleName: 'Menace Updater Test', CFBundleVersion: version, CFBundleShortVersionString: version })) {
                run('plutil', ['-replace', key, '-string', value, plist]);
            }
            // HTTP is limited to isolated loopback fixtures, never production.
            run('plutil', ['-replace', 'NSAppTransportSecurity', '-json', '{"NSAllowsArbitraryLoads":true}', plist]);
            run('codesign', ['--force', '--deep', '--timestamp=none', '--options', 'runtime', '--entitlements', path.join(root, 'entitlements.plist'), '--sign', signingIdentity, appPath]);
            return appPath;
        }
        const common = `const {app,autoUpdater}=require('electron');const fs=require('fs');app.setPath('userData',${JSON.stringify(path.join(work, 'user-data'))});`;
        const target = makeBundle('target', '1.0.2', common + `app.whenReady().then(()=>{fs.writeFileSync(${JSON.stringify(resultPath)},JSON.stringify({version:app.getVersion(),settings:fs.readFileSync(${JSON.stringify(dataPath)},'utf8')}));app.quit();});`, identity);
        run('ditto', ['-c', '-k', '--keepParent', target, path.join(work, 'update.zip')]);
        const untrusted = path.join(work, 'untrusted', 'Menace Updater Test.app');
        run('ditto', [target, untrusted]);
        run('codesign', ['--force', '--deep', '--sign', '-', untrusted]);
        run('ditto', ['-c', '-k', '--keepParent', untrusted, path.join(work, 'untrusted.zip')]);
        fs.writeFileSync(path.join(work, 'broken.zip'), 'not a valid ZIP');
        const source = makeBundle('installed', '1.0.1', common + `
            const {createUpdateController}=require('./src/utils/updateChecker');
            const nativeFeed=autoUpdater.setFeedURL.bind(autoUpdater);
            autoUpdater.setFeedURL=()=>nativeFeed({url:'http://127.0.0.1:${port}/feed'});
            let errors=0;
            const controller=createUpdateController({app,autoUpdater,onState:state=>{
                fs.appendFileSync(${JSON.stringify(eventsPath)},JSON.stringify(state)+'\\n');
                if(state.status==='current')setTimeout(()=>controller.check(),200);
                if(state.status==='error'){errors++;if(errors<=2)setTimeout(()=>controller.check(),200);else app.quit();}
                if(state.status==='ready'){
                    if(errors!==2)throw new Error('Invalid artifacts did not fail closed');
                    setTimeout(()=>controller.install(),200);
                }
            }});
            app.whenReady().then(()=>controller.start());`, identity);
        console.log(`Native updater fixtures: ${work}`);
        const env = { ...process.env };
        delete env.ELECTRON_RUN_AS_NODE;
        child = spawn(path.join(source, 'Contents/MacOS/Menace Updater Test'), [], { env, stdio: 'ignore' });
        const deadline = Date.now() + 180_000;
        while (!fs.existsSync(resultPath) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 500));
        assert.ok(fs.existsSync(resultPath), `Native install/relaunch did not finish; inspect ${eventsPath}`);
        const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
        const events = fs.readFileSync(eventsPath, 'utf8').trim().split('\n').map(line => JSON.parse(line));
        assert.equal(result.version, '1.0.2');
        assert.equal(result.settings, originalData);
        assert.ok(events.some(event => event.status === 'current'));
        assert.equal(events.filter(event => event.status === 'error').length, 2);
        assert.equal(events.filter(event => event.status === 'ready').length, 1);
        assert.ok(events.some(event => event.status === 'installing'));
        console.log('Native Squirrel passed: no update, broken ZIP rejected, untrusted signature rejected, signed update installed/relaunched at 1.0.2, fixture data retained.');
    } finally {
        child?.kill();
        server.closeAllConnections();
        server.close();
    }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
