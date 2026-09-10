const { app } = require('electron');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {
    const helper = path.join(path.dirname(process.execPath), '..', 'Helpers', 'SystemAudioDump');
    const fallback = path.join(__dirname, '../src/assets/CheatingDaddyAudio.app/Contents/MacOS/CheatingDaddyAudio');
    const bin = fs.existsSync(helper) ? helper : fallback;

    console.log('[test] spawning', bin);
    console.log('[test] exists', fs.existsSync(bin));

    const chunks = [];
    const errs = [];
    const child = spawn(bin, [], { stdio: ['ignore', 'pipe', 'pipe'] });

    child.stdout.on('data', chunk => chunks.push(chunk));
    child.stderr.on('data', chunk => errs.push(chunk));

    setTimeout(() => {
        spawnSync('ffmpeg', ['-f', 'lavfi', '-i', 'sine=frequency=880:duration=2', '-af', 'volume=1', '/tmp/tone-electron.wav', '-y'], {
            stdio: 'ignore',
        });
        spawnSync('afplay', ['/tmp/tone-electron.wav']);
    }, 200);

    setTimeout(() => {
        child.kill('SIGTERM');
    }, 3500);

    child.on('close', code => {
        const buf = Buffer.concat(chunks);
        let rms = 0;
        let max = 0;
        let nz = 0;
        const samples = Math.floor(buf.length / 4);
        for (let i = 0; i < samples; i++) {
            const sample = buf.readInt16LE(i * 4);
            rms += sample * sample;
            max = Math.max(max, Math.abs(sample));
            if (sample !== 0) nz += 1;
        }
        rms = samples ? Math.sqrt(rms / samples) : 0;

        console.log(
            JSON.stringify(
                {
                    exitCode: code,
                    bytes: buf.length,
                    rms: Math.round(rms),
                    max,
                    nonzero: nz,
                    stderr: Buffer.concat(errs).toString().trim(),
                },
                null,
                2
            )
        );
        app.quit();
    });
});
