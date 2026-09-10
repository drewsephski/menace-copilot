const { app, desktopCapturer, systemPreferences, shell } = require('electron');

app.whenReady().then(async () => {
    const before = systemPreferences.getMediaAccessStatus('screen');
    console.log('[permissions] screen status before:', before);

    try {
        await desktopCapturer.getSources({ types: ['screen'] });
    } catch (error) {
        console.warn('[permissions] desktopCapturer error:', error.message);
    }

    const after = systemPreferences.getMediaAccessStatus('screen');
    console.log('[permissions] screen status after:', after);

    // Register Electron in System Settings and open the right pane.
    const major = Number(process.getSystemVersion().split('.')[0]);
    const pane =
        major >= 26
            ? 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'
            : 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture';

    console.log('[permissions] Opening System Settings. Enable Electron under');
    console.log('[permissions] Privacy & Security → Screen & System Audio Recording');
    if (major >= 26) {
        console.log('[permissions] On macOS 26+, also check System Audio Recording Only.');
    }

    await shell.openExternal(pane);
    setTimeout(() => app.quit(), 2000);
});
