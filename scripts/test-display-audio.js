const { app, BrowserWindow, desktopCapturer, session, systemPreferences } = require('electron');

app.whenReady().then(async () => {
    console.log('[test] screen status', systemPreferences.getMediaAccessStatus('screen'));
    console.log('[test] mic status', systemPreferences.getMediaAccessStatus('microphone'));

    session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
        const sources = await desktopCapturer.getSources({ types: ['screen'] });
        callback({ video: sources[0], audio: 'loopback' });
    });

    const win = new BrowserWindow({
        width: 640,
        height: 480,
        show: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false },
    });

    await win.loadURL('data:text/html,<html><body>audio test</body></html>');

    const result = await win.webContents.executeJavaScript(`
        (async () => {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });
            const audioTracks = stream.getAudioTracks();
            if (!audioTracks.length) return { ok: false, reason: 'no audio track' };

            const ctx = new AudioContext();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser);
            const data = new Uint8Array(analyser.fftSize);

            await new Promise(r => setTimeout(r, 2500));
            analyser.getByteTimeDomainData(data);
            let sum = 0;
            let max = 0;
            for (let i = 0; i < data.length; i++) {
                const v = Math.abs(data[i] - 128);
                sum += v;
                max = Math.max(max, v);
            }
            return {
                ok: true,
                tracks: audioTracks.map(t => ({ label: t.label, enabled: t.enabled, muted: t.muted, readyState: t.readyState })),
                avg: sum / data.length,
                max,
            };
        })()
    `);

    console.log(JSON.stringify(result, null, 2));
    app.quit();
});
