const fs = require('fs');
const path = require('path');
const { getConfigDir } = require('../storage');

let logStream = null;
let isFirstEvent = true;
let currentLogPath = null;

function isTransportLoggingEnabled() {
    return process.env.MENACE_DEBUG_TRANSPORT === '1';
}

function startTransportLog(sessionId) {
    closeTransportLog();

    if (!isTransportLoggingEnabled()) {
        return;
    }

    const logsDirectory = path.join(getConfigDir(), 'logs');
    fs.mkdirSync(logsDirectory, { recursive: true });

    currentLogPath = path.join(logsDirectory, `${sessionId}.json`);
    logStream = fs.createWriteStream(currentLogPath, { flags: 'w' });
    logStream.on('error', function (error) {
        console.error('Transport log stream error:', error.message);
    });
    isFirstEvent = true;
    logStream.write('[\n');

    logTransportEvent('session.started', { sessionId });
    console.log('Transport log:', currentLogPath);
}

function logTransportEvent(type, data) {
    if (!logStream || !isTransportLoggingEnabled()) {
        return;
    }

    try {
        const event = {
            timestamp: Date.now(),
            type,
            data,
        };
        const prefix = isFirstEvent ? '' : ',\n';
        logStream.write(prefix + JSON.stringify(event));
        isFirstEvent = false;
    } catch (error) {
        console.error('Failed to write transport log event:', error.message);
    }
}

function closeTransportLog() {
    if (!logStream) {
        return;
    }

    logTransportEvent('session.closed', {});
    logStream.end('\n]\n');
    logStream = null;
    currentLogPath = null;
    isFirstEvent = true;
}

module.exports = {
    isTransportLoggingEnabled,
    startTransportLog,
    logTransportEvent,
    closeTransportLog,
};
