const { GoogleGenAI, Modality } = require('@google/genai');
const { BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const { saveDebugAudio } = require('../audioUtils');
const { getSystemPrompt } = require('./prompts');
const {
    getAvailableModel,
    incrementLimitCount,
    getApiKey,
    incrementCharUsage,
    getConfig,
    getPreferences,
    updatePreference,
    getCredentials,
} = require('../storage');
const { getOpenRouterAccess, getUserOpenRouterApiKey } = require('./openrouterCredentials');
const { streamHostedChatCompletion } = require('./hostedAiClient');
const polar = require('./polar');
const { connectCloud, sendCloudAudio, sendCloudText, sendCloudImage, closeCloud, isCloudActive, setOnTurnComplete } = require('./cloud');
const { startTransportLog, logTransportEvent, closeTransportLog } = require('./transportLogger');

// Lazy-loaded to avoid circular dependency (localai.js imports from gemini.js)
let _localai = null;
function getLocalAi() {
    if (!_localai) _localai = require('./localai');
    return _localai;
}

// Provider mode: 'byok', 'cloud', 'local', or 'whisper_openrouter'
let currentProviderMode = 'byok';

function usesLocalWhisper() {
    return currentProviderMode === 'local' || currentProviderMode === 'whisper_openrouter';
}

// OpenRouter conversation history for context
let answerConversationHistory = [];

// Conversation tracking variables
let currentSessionId = null;
let currentTranscription = '';
let conversationHistory = [];
let screenAnalysisHistory = [];
let currentProfile = null;
let currentCustomPrompt = null;
let isInitializingSession = false;
let currentSystemPrompt = null;

function formatSpeakerResults(results) {
    let text = '';
    for (const result of results) {
        if (result.transcript && result.speakerId) {
            const speakerLabel = result.speakerId === 1 ? 'Other participant' : 'You';
            text += `[${speakerLabel}]: ${result.transcript}\n`;
        }
    }
    return text;
}

module.exports.formatSpeakerResults = formatSpeakerResults;

// Audio capture variables
let systemAudioProc = null;
let messageBuffer = '';
let openRouterRequestStartedForTurn = false;

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MAX_TOKENS = 16384;
const OPENROUTER_VISION_MODEL = 'google/gemini-2.5-flash';
const OPENROUTER_EMPTY_RESPONSE_MESSAGE =
    'OpenRouter reached the maximum token limit before returning a final answer. Try a shorter prompt or a different model.';

// Reconnection variables
let isUserClosing = false;
let sessionParams = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 2000;

function sendToRenderer(channel, data) {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
        windows[0].webContents.send(channel, data);
    }
}

// Build context message for session restoration
function buildContextMessage() {
    const lastTurns = conversationHistory.slice(-20);
    const validTurns = lastTurns.filter(turn => turn.transcription?.trim() && turn.ai_response?.trim());

    if (validTurns.length === 0) return null;

    const contextLines = validTurns.map(turn => `[Other participant]: ${turn.transcription.trim()}\n[Your answer]: ${turn.ai_response.trim()}`);

    return `Session reconnected. Here's the conversation so far:\n\n${contextLines.join('\n\n')}\n\nContinue from here.`;
}

// Conversation management functions
function initializeNewSession(profile = null, customPrompt = null) {
    currentSessionId = Date.now().toString();
    startTransportLog(currentSessionId);
    currentTranscription = '';
    openRouterRequestStartedForTurn = false;
    conversationHistory = [];
    screenAnalysisHistory = [];
    answerConversationHistory = [];
    currentProfile = profile;
    currentCustomPrompt = customPrompt;
    console.log('New conversation session started:', currentSessionId, 'profile:', profile);

    // Save initial session with profile context
    if (profile) {
        sendToRenderer('save-session-context', {
            sessionId: currentSessionId,
            profile: profile,
            customPrompt: customPrompt || '',
        });
    }
}

function saveConversationTurn(transcription, aiResponse) {
    if (!currentSessionId) {
        initializeNewSession();
    }

    const conversationTurn = {
        timestamp: Date.now(),
        transcription: transcription.trim(),
        ai_response: aiResponse.trim(),
    };

    conversationHistory.push(conversationTurn);
    console.log('Saved conversation turn:', conversationTurn);

    // Send to renderer to save in IndexedDB
    sendToRenderer('save-conversation-turn', {
        sessionId: currentSessionId,
        turn: conversationTurn,
        fullHistory: conversationHistory,
    });
}

function saveScreenAnalysis(prompt, response, model) {
    if (!currentSessionId) {
        initializeNewSession();
    }

    const analysisEntry = {
        timestamp: Date.now(),
        prompt: prompt,
        response: response.trim(),
        model: model,
    };

    screenAnalysisHistory.push(analysisEntry);
    console.log('Saved screen analysis:', analysisEntry);

    // Send to renderer to save
    sendToRenderer('save-screen-analysis', {
        sessionId: currentSessionId,
        analysis: analysisEntry,
        fullHistory: screenAnalysisHistory,
        profile: currentProfile,
        customPrompt: currentCustomPrompt,
    });
}

function getCurrentSessionData() {
    return {
        sessionId: currentSessionId,
        history: conversationHistory,
    };
}

function isGoogleSearchEnabled() {
    const prefs = getPreferences();
    return Boolean(prefs.googleSearchEnabled);
}

async function getEnabledTools() {
    const tools = [];

    if (isGoogleSearchEnabled()) {
        tools.push({ googleSearch: {} });
        console.log('Added Google Search tool');
    } else {
        console.log('Google Search tool disabled');
    }

    return tools;
}

function canRouteAnswersViaOpenRouter() {
    return getOpenRouterAccess().available;
}

function hasOpenRouterKey() {
    return canRouteAnswersViaOpenRouter();
}

function usesHostedAnswerGateway() {
    return getOpenRouterAccess().source === 'hosted';
}

async function ensureLicensedSession() {
    const gate = await polar.requireActiveLicense();
    if (!gate.ok) {
        sendToRenderer('update-status', gate.error);
        return false;
    }
    return true;
}

function sendFinalTranscriptionToOpenRouter() {
    if (!hasOpenRouterKey() || openRouterRequestStartedForTurn) {
        return;
    }

    const transcription = currentTranscription.trim();
    if (transcription === '') {
        return;
    }

    openRouterRequestStartedForTurn = true;
    sendToOpenRouter(transcription);
}

function trimConversationHistoryForGemma(history, maxChars = 42000) {
    if (!history || history.length === 0) return [];
    let totalChars = 0;
    const trimmed = [];

    for (let i = history.length - 1; i >= 0; i--) {
        const turn = history[i];
        const turnChars = (turn.content || '').length;

        if (totalChars + turnChars > maxChars) break;
        totalChars += turnChars;
        trimmed.unshift(turn);
    }
    return trimmed;
}

function stripThinkingTags(text) {
    const trimmedStart = text.trimStart();
    if ('<think>'.startsWith(trimmedStart)) {
        return '';
    }

    return text.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '').trim();
}

async function readOpenRouterSseStream(response, eventPrefix, onDisplayText) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let finishReason = null;
    let isFirst = true;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        logTransportEvent(`${eventPrefix}.stream_chunk`, { chunk: buffer.slice(-2000) });

        while (true) {
            const lineEnd = buffer.indexOf('\n');
            if (lineEnd === -1) break;

            const line = buffer.slice(0, lineEnd).trim();
            buffer = buffer.slice(lineEnd + 1);

            if (!line || line.startsWith(':')) continue;
            if (!line.startsWith('data: ')) continue;

            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
                const json = JSON.parse(data);
                logTransportEvent(`${eventPrefix}.stream_event`, json);
                finishReason = json.choices?.[0]?.finish_reason || finishReason;
                const token = json.choices?.[0]?.delta?.content || '';
                if (!token) continue;

                fullText += token;
                const displayText = stripThinkingTags(fullText);
                if (displayText) {
                    onDisplayText(displayText, isFirst);
                    isFirst = false;
                }
            } catch (parseError) {
                logTransportEvent(`${eventPrefix}.stream_parse_error`, {
                    data,
                    error: parseError.message,
                });
            }
        }
    }

    return { fullText, finishReason };
}

async function sendToOpenRouter(transcription) {
    const access = getOpenRouterAccess();
    if (!access.available) {
        console.log('No OpenRouter or hosted gateway access configured, skipping answer routing');
        return;
    }

    if (!transcription || transcription.trim() === '') {
        console.log('Empty transcription, skipping OpenRouter');
        return;
    }

    const config = getConfig();
    const modelToUse = config.openrouterModel;

    if (process.env.MENACE_DEBUG_TRANSPORT === '1') {
        console.log(`Sending answer request (${modelToUse}, ${access.source})`);
    }
    logTransportEvent('openrouter.text.request', {
        model: modelToUse,
        transcription,
        source: access.source,
    });

    answerConversationHistory.push({
        role: 'user',
        content: transcription.trim(),
    });

    if (answerConversationHistory.length > 20) {
        answerConversationHistory = answerConversationHistory.slice(-20);
    }

    const messages = [{ role: 'system', content: currentSystemPrompt || 'You are a helpful assistant.' }, ...answerConversationHistory];

    try {
        let fullText = '';
        let finishReason = 'stop';

        if (usesHostedAnswerGateway()) {
            const hostedResult = await streamHostedChatCompletion({
                model: modelToUse,
                messages,
                onToken: (displayText, isFirst) => {
                    sendToRenderer(isFirst ? 'new-response' : 'update-response', displayText);
                },
            });
            fullText = hostedResult.fullText;
            finishReason = hostedResult.finishReason;
        } else {
            const openRouterApiKey = getUserOpenRouterApiKey();
            if (!openRouterApiKey) {
                return;
            }

            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${openRouterApiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://openrouter.ai',
                    'X-OpenRouter-Title': 'menace-agent',
                },
                body: JSON.stringify({
                    model: modelToUse,
                    messages,
                    stream: true,
                    temperature: 0.7,
                    max_tokens: OPENROUTER_MAX_TOKENS,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('OpenRouter API error:', response.status, errorText);
                logTransportEvent('openrouter.text.http_error', {
                    status: response.status,
                    body: errorText,
                });
                sendToRenderer('update-status', `OpenRouter error: ${response.status}`);
                return;
            }

            logTransportEvent('openrouter.text.http_response', {
                status: response.status,
            });

            const streamResult = await readOpenRouterSseStream(response, 'openrouter.text', (displayText, isFirst) => {
                sendToRenderer(isFirst ? 'new-response' : 'update-response', displayText);
            });
            fullText = streamResult.fullText;
            finishReason = streamResult.finishReason;
        }

        const cleanedResponse = stripThinkingTags(fullText);
        const modelKey = modelToUse.split('/').pop();

        const systemPromptChars = (currentSystemPrompt || 'You are a helpful assistant.').length;
        const historyChars = answerConversationHistory.reduce((sum, msg) => sum + (msg.content || '').length, 0);
        const inputChars = systemPromptChars + historyChars;
        const outputChars = cleanedResponse.length;

        incrementCharUsage('openrouter', modelKey, inputChars + outputChars);

        if (cleanedResponse) {
            answerConversationHistory.push({
                role: 'assistant',
                content: cleanedResponse,
            });

            saveConversationTurn(transcription, cleanedResponse);
        } else {
            console.warn(`OpenRouter returned no final answer (${modelToUse})`);
            logTransportEvent('openrouter.text.empty_response', {
                model: modelToUse,
                fullText,
                finishReason,
            });
            sendToRenderer('new-response', OPENROUTER_EMPTY_RESPONSE_MESSAGE);
            sendToRenderer('update-status', 'OpenRouter reached the token limit');
            return;
        }

        logTransportEvent('openrouter.text.completed', {
            model: modelToUse,
            response: cleanedResponse,
        });
        console.log(`OpenRouter response completed (${modelToUse})`);
        sendToRenderer('update-status', 'Listening...');
    } catch (error) {
        console.error('Error calling OpenRouter API:', error);
        logTransportEvent('openrouter.text.error', {
            error: error.message,
            stack: error.stack,
        });
        sendToRenderer('update-status', 'OpenRouter error: ' + error.message);
    }
}

async function sendToGemma(transcription) {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.log('No Gemini API key configured');
        return;
    }

    if (!transcription || transcription.trim() === '') {
        console.log('Empty transcription, skipping Gemma');
        return;
    }

    if (process.env.MENACE_DEBUG_TRANSPORT === '1') {
        console.log('Sending to Gemma');
    }

    answerConversationHistory.push({
        role: 'user',
        content: transcription.trim(),
    });

    const trimmedHistory = trimConversationHistoryForGemma(answerConversationHistory, 42000);

    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });

        const messages = trimmedHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        const systemPrompt = currentSystemPrompt || 'You are a helpful assistant.';
        const messagesWithSystem = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] },
            ...messages,
        ];

        const response = await ai.models.generateContentStream({
            model: 'gemma-4-26b-a4b-it',
            contents: messagesWithSystem,
        });

        let fullText = '';
        let isFirst = true;

        for await (const chunk of response) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullText += chunkText;
                sendToRenderer(isFirst ? 'new-response' : 'update-response', fullText);
                isFirst = false;
            }
        }

        const systemPromptChars = (currentSystemPrompt || 'You are a helpful assistant.').length;
        const historyChars = trimmedHistory.reduce((sum, msg) => sum + (msg.content || '').length, 0);
        const inputChars = systemPromptChars + historyChars;
        const outputChars = fullText.length;

        incrementCharUsage('gemini', 'gemma-4-26b-a4b-it', inputChars + outputChars);

        if (fullText.trim()) {
            answerConversationHistory.push({
                role: 'assistant',
                content: fullText.trim(),
            });

            if (answerConversationHistory.length > 40) {
                answerConversationHistory = answerConversationHistory.slice(-40);
            }

            saveConversationTurn(transcription, fullText);
        }

        console.log('Gemma response completed');
        sendToRenderer('update-status', 'Listening...');
    } catch (error) {
        console.error('Error calling Gemma API:', error);
        sendToRenderer('update-status', 'Gemma error: ' + error.message);
    }
}

async function initializeGeminiSession(apiKey, customPrompt = '', profile = 'sales', language = 'en-US', isReconnect = false) {
    if (isInitializingSession) {
        console.log('Session initialization already in progress');
        return false;
    }

    isInitializingSession = true;
    if (!isReconnect) {
        sendToRenderer('session-initializing', true);
    }

    // Store params for reconnection
    if (!isReconnect) {
        sessionParams = { apiKey, customPrompt, profile, language };
        reconnectAttempts = 0;
    }

    const client = new GoogleGenAI({
        vertexai: false,
        apiKey: apiKey,
        httpOptions: { apiVersion: 'v1alpha' },
    });

    // Get enabled tools first to determine Google Search status
    const enabledTools = await getEnabledTools();
    const googleSearchEnabled = enabledTools.some(tool => tool.googleSearch);
    // OpenRouter generates live answers when configured — it has no Google Search tool.
    const searchInPrompt = googleSearchEnabled && !hasOpenRouterKey();

    const systemPrompt = getSystemPrompt(profile, customPrompt, searchInPrompt);
    currentSystemPrompt = systemPrompt; // Store for OpenRouter

    // Initialize new conversation session only on first connect
    if (!isReconnect) {
        initializeNewSession(profile, customPrompt);
    }

    try {
        const session = await client.live.connect({
            model: getConfig().geminiLiveModel,
            callbacks: {
                onopen: function () {
                    logTransportEvent('gemini.live.opened', {});
                    sendToRenderer('update-status', 'Live session connected');
                },
                onmessage: function (message) {
                    console.log('----------------', message);
                    logTransportEvent('gemini.live.message', message);

                    // Handle input transcription (what was spoken)
                    if (message.serverContent?.inputTranscription?.results) {
                        currentTranscription += formatSpeakerResults(message.serverContent.inputTranscription.results);
                    } else if (message.serverContent?.inputTranscription?.text) {
                        const text = message.serverContent.inputTranscription.text;
                        if (text.trim() !== '') {
                            currentTranscription += text;
                        }
                    }

                    if (!hasOpenRouterKey() && message.serverContent?.outputTranscription?.text) {
                        const isFirstChunk = messageBuffer === '';
                        messageBuffer += message.serverContent.outputTranscription.text;
                        sendToRenderer(isFirstChunk ? 'new-response' : 'update-response', messageBuffer);
                    }

                    if (message.serverContent?.generationComplete) {
                        if (currentTranscription.trim() !== '') {
                            if (!hasOpenRouterKey() && messageBuffer.trim() !== '') {
                                saveConversationTurn(currentTranscription, messageBuffer);
                            }
                            currentTranscription = '';
                        }
                        messageBuffer = '';
                    }

                    if (message.serverContent?.turnComplete) {
                        // Wait for the full interviewer turn before calling OpenRouter —
                        // firing on every partial transcription chunk caused repeat answers.
                        sendFinalTranscriptionToOpenRouter();
                        currentTranscription = '';
                        messageBuffer = '';
                        // Reset after this turn is handed off so the next question can fire.
                        queueMicrotask(() => {
                            openRouterRequestStartedForTurn = false;
                        });
                        sendToRenderer('update-status', 'Listening...');
                    }
                },
                onerror: function (e) {
                    console.log('Session error:', e.message);
                    logTransportEvent('gemini.live.error', {
                        error: e.message,
                    });
                    sendToRenderer('update-status', 'Error: ' + e.message);
                },
                onclose: function (e) {
                    console.log('Session closed:', e.reason);
                    logTransportEvent('gemini.live.closed', {
                        reason: e.reason,
                    });

                    // Don't reconnect if user intentionally closed
                    if (isUserClosing) {
                        isUserClosing = false;
                        closeTransportLog();
                        sendToRenderer('update-status', 'Session closed');
                        return;
                    }

                    // Attempt reconnection
                    if (sessionParams && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                        attemptReconnect();
                    } else {
                        closeTransportLog();
                        sendToRenderer('update-status', 'Session closed');
                    }
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                // proactiveAudio invents interviewer questions (often from prompt examples)
                // when the audio stream is quiet — keep it off for interview use.
                proactivity: { proactiveAudio: false },
                outputAudioTranscription: {},
                tools: enabledTools,
                // Enable speaker diarization
                inputAudioTranscription: {
                    enableSpeakerDiarization: true,
                    minSpeakerCount: 2,
                    maxSpeakerCount: 2,
                },
                contextWindowCompression: { slidingWindow: {} },
                speechConfig: { languageCode: language },
                systemInstruction: {
                    parts: [{ text: systemPrompt }],
                },
            },
        });

        isInitializingSession = false;
        if (!isReconnect) {
            sendToRenderer('session-initializing', false);
        }
        return session;
    } catch (error) {
        console.error('Failed to initialize Gemini session:', error);
        isInitializingSession = false;
        if (!isReconnect) {
            sendToRenderer('session-initializing', false);
        }
        return null;
    }
}

async function attemptReconnect() {
    reconnectAttempts++;
    console.log(`Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);

    // Clear stale buffers
    messageBuffer = '';
    currentTranscription = '';
    // Don't reset answerConversationHistory to preserve context across reconnects

    sendToRenderer('update-status', `Reconnecting... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

    // Wait before attempting
    await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));

    try {
        const session = await initializeGeminiSession(
            sessionParams.apiKey,
            sessionParams.customPrompt,
            sessionParams.profile,
            sessionParams.language,
            true // isReconnect
        );

        if (session && global.geminiSessionRef) {
            global.geminiSessionRef.current = session;

            // Restore context from conversation history via text message
            const contextMessage = buildContextMessage();
            if (contextMessage) {
                try {
                    console.log('Restoring conversation context...');
                    await session.sendRealtimeInput({ text: contextMessage });
                } catch (contextError) {
                    console.error('Failed to restore context:', contextError);
                    // Continue without context - better than failing
                }
            }

            // Don't reset reconnectAttempts here - let it reset on next fresh session
            sendToRenderer('update-status', 'Reconnected! Listening...');
            console.log('Session reconnected successfully');
            return true;
        }
    } catch (error) {
        console.error(`Reconnection attempt ${reconnectAttempts} failed:`, error);
    }

    // If we still have attempts left, try again
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        return attemptReconnect();
    }

    // Max attempts reached - notify frontend
    console.log('Max reconnection attempts reached');
    sendToRenderer('reconnect-failed', {
        message: 'Tried 3 times to reconnect. Must be upstream/network issues. Try restarting or download updated app from site.',
    });
    sessionParams = null;
    return false;
}

function killExistingSystemAudioDump() {
    return new Promise(resolve => {
        console.log('Checking for existing SystemAudioDump processes...');

        // Kill any existing SystemAudioDump processes (including the helper .app binary)
        const killProc = spawn('pkill', ['-f', 'SystemAudioDump'], {
            stdio: 'ignore',
        });

        killProc.on('close', code => {
            if (code === 0) {
                console.log('Killed existing SystemAudioDump processes');
            } else {
                console.log('No existing SystemAudioDump processes found');
            }
            resolve();
        });

        killProc.on('error', err => {
            console.log('Error checking for existing processes (this is normal):', err.message);
            resolve();
        });

        // Timeout after 2 seconds
        setTimeout(() => {
            killProc.kill();
            resolve();
        }, 2000);
    });
}

function resolveMacOSSystemAudioDumpPath() {
    const { app } = require('electron');
    const fs = require('fs');
    const path = require('path');

    // On macOS 26+, SystemAudioDump can report permissions OK while streaming
    // silence unless it is attributed to an app that has Screen/System Audio
    // Recording permission. Prefer helpers inside the host .app bundle first.
    const electronHelper = path.join(path.dirname(process.execPath), '..', 'Helpers', 'SystemAudioDump');

    const candidates = app.isPackaged
        ? [
              path.join(process.resourcesPath, 'CheatingDaddyAudio.app', 'Contents', 'MacOS', 'CheatingDaddyAudio'),
              path.join(process.resourcesPath, 'CheatingDaddyAudio.app', 'Contents', 'MacOS', 'SystemAudioDump'),
              path.join(process.resourcesPath, 'SystemAudioDump'),
              electronHelper,
          ]
        : [
              electronHelper,
              path.join(__dirname, '../assets/CheatingDaddyAudio.app/Contents/MacOS/CheatingDaddyAudio'),
              path.join(__dirname, '../assets/CheatingDaddyAudio.app/Contents/MacOS/SystemAudioDump'),
              path.join(__dirname, '../assets/SystemAudioDump'),
          ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return candidates[candidates.length - 1];
}

async function startMacOSAudioCapture(geminiSessionRef) {
    if (process.platform !== 'darwin') return false;

    // Kill any existing SystemAudioDump processes first
    await killExistingSystemAudioDump();

    console.log('Starting macOS audio capture with SystemAudioDump...');

    const systemAudioPath = resolveMacOSSystemAudioDumpPath();

    console.log('SystemAudioDump path:', systemAudioPath);

    const spawnOptions = {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
            ...process.env,
        },
    };

    systemAudioProc = spawn(systemAudioPath, [], spawnOptions);

    if (!systemAudioProc.pid) {
        console.error('Failed to start SystemAudioDump');
        return false;
    }

    console.log('SystemAudioDump started with PID:', systemAudioProc.pid);

    const CHUNK_DURATION = 0.1;
    const SAMPLE_RATE = 24000;
    const BYTES_PER_SAMPLE = 2;
    const CHANNELS = 2;
    const CHUNK_SIZE = SAMPLE_RATE * BYTES_PER_SAMPLE * CHANNELS * CHUNK_DURATION;

    let audioBuffer = Buffer.alloc(0);

    systemAudioProc.stdout.on('data', data => {
        audioBuffer = Buffer.concat([audioBuffer, data]);

        while (audioBuffer.length >= CHUNK_SIZE) {
            const chunk = audioBuffer.slice(0, CHUNK_SIZE);
            audioBuffer = audioBuffer.slice(CHUNK_SIZE);

            const monoChunk = CHANNELS === 2 ? convertStereoToMono(chunk) : chunk;

            if (currentProviderMode === 'cloud') {
                sendCloudAudio(monoChunk);
            } else if (usesLocalWhisper()) {
                getLocalAi().processLocalAudio(monoChunk);
            } else {
                const base64Data = monoChunk.toString('base64');
                sendAudioToGemini(base64Data, geminiSessionRef);
            }

            if (process.env.DEBUG_AUDIO) {
                console.log(`Processed audio chunk: ${chunk.length} bytes`);
                saveDebugAudio(monoChunk, 'system_audio');
            }
        }

        const maxBufferSize = SAMPLE_RATE * BYTES_PER_SAMPLE * 1;
        if (audioBuffer.length > maxBufferSize) {
            audioBuffer = audioBuffer.slice(-maxBufferSize);
        }
    });

    systemAudioProc.stderr.on('data', data => {
        console.error('SystemAudioDump stderr:', data.toString());
    });

    systemAudioProc.on('close', code => {
        console.log('SystemAudioDump process closed with code:', code);
        systemAudioProc = null;
    });

    systemAudioProc.on('error', err => {
        console.error('SystemAudioDump process error:', err);
        systemAudioProc = null;
    });

    return true;
}

function convertStereoToMono(stereoBuffer) {
    const samples = stereoBuffer.length / 4;
    const monoBuffer = Buffer.alloc(samples * 2);

    for (let i = 0; i < samples; i++) {
        const leftSample = stereoBuffer.readInt16LE(i * 4);
        monoBuffer.writeInt16LE(leftSample, i * 2);
    }

    return monoBuffer;
}

function stopMacOSAudioCapture() {
    if (systemAudioProc) {
        console.log('Stopping SystemAudioDump...');
        systemAudioProc.kill('SIGTERM');
        systemAudioProc = null;
    }
}

async function sendAudioToGemini(base64Data, geminiSessionRef) {
    if (!geminiSessionRef.current) return;

    try {
        process.stdout.write('.');
        await geminiSessionRef.current.sendRealtimeInput({
            audio: {
                data: base64Data,
                mimeType: 'audio/pcm;rate=24000',
            },
        });
    } catch (error) {
        console.error('Error sending audio to Gemini:', error);
    }
}

async function sendImageToOpenRouter(base64Data, prompt) {
    const access = getOpenRouterAccess();
    if (!access.available) {
        return {
            success: false,
            error: 'Screen context is unavailable. Use a pass with included AI, or add a Gemini API key on the home screen.',
        };
    }

    const model = OPENROUTER_VISION_MODEL;
    const messages = [
        { role: 'system', content: currentSystemPrompt || 'You are a helpful assistant.' },
        {
            role: 'user',
            content: [
                { type: 'text', text: prompt },
                {
                    type: 'image_url',
                    image_url: { url: `data:image/jpeg;base64,${base64Data}` },
                },
            ],
        },
    ];

    try {
        console.log(`Sending image answer request (${model}, ${access.source}, streaming)...`);
        logTransportEvent('openrouter.vision.request', { model, prompt, source: access.source });

        if (usesHostedAnswerGateway()) {
            let fullText = '';
            const hostedResult = await streamHostedChatCompletion({
                model,
                messages,
                onToken: (displayText, isFirst) => {
                    fullText = displayText;
                    sendToRenderer(isFirst ? 'new-response' : 'update-response', displayText);
                },
            });
            fullText = hostedResult.fullText || fullText;
            if (fullText.trim()) {
                saveScreenAnalysis(prompt, fullText, model);
            }
            return { success: true, model };
        }

        const openRouterApiKey = getUserOpenRouterApiKey();
        if (!openRouterApiKey) {
            return { success: false, error: 'OpenRouter key required for screen context.' };
        }

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${openRouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://openrouter.ai',
                'X-OpenRouter-Title': 'menace-agent',
            },
            body: JSON.stringify({
                model,
                messages,
                stream: true,
                max_tokens: OPENROUTER_MAX_TOKENS,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter vision API error:', response.status, errorText);
            logTransportEvent('openrouter.vision.http_error', { status: response.status, body: errorText });
            return { success: false, error: `OpenRouter error: ${response.status}` };
        }

        const { fullText } = await readOpenRouterSseStream(response, 'openrouter.vision', (displayText, isFirst) => {
            sendToRenderer(isFirst ? 'new-response' : 'update-response', displayText);
        });

        const cleanedResponse = stripThinkingTags(fullText);
        const modelKey = model.split('/').pop();
        incrementCharUsage('openrouter', modelKey, prompt.length + cleanedResponse.length);

        if (cleanedResponse) {
            saveScreenAnalysis(prompt, cleanedResponse, model);
        }

        console.log(`Image response completed from OpenRouter (${model})`);
        return { success: true, text: cleanedResponse, model };
    } catch (error) {
        console.error('Error sending image to OpenRouter:', error);
        logTransportEvent('openrouter.vision.error', { error: error.message });
        return { success: false, error: error.message };
    }
}

async function sendImageToGeminiHttp(base64Data, prompt) {
    // Get available model based on rate limits
    const model = getAvailableModel();

    const apiKey = getApiKey();
    if (!apiKey) {
        return await sendImageToOpenRouter(base64Data, prompt);
    }

    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });

        const contents = [
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data,
                },
            },
            { text: prompt },
        ];

        console.log(`Sending image to ${model} (streaming)...`);
        const response = await ai.models.generateContentStream({
            model: model,
            contents: contents,
        });

        // Increment count after successful call
        incrementLimitCount(model);

        // Stream the response
        let fullText = '';
        let isFirst = true;
        for await (const chunk of response) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullText += chunkText;
                // Send to renderer - new response for first chunk, update for subsequent
                sendToRenderer(isFirst ? 'new-response' : 'update-response', fullText);
                isFirst = false;
            }
        }

        console.log(`Image response completed from ${model}`);

        // Save screen analysis to history
        saveScreenAnalysis(prompt, fullText, model);

        return { success: true, text: fullText, model: model };
    } catch (error) {
        console.error('Error sending image to Gemini HTTP:', error);
        return { success: false, error: error.message };
    }
}

function setupGeminiIpcHandlers(geminiSessionRef) {
    // Store the geminiSessionRef globally for reconnection access
    global.geminiSessionRef = geminiSessionRef;

    ipcMain.handle('initialize-cloud', async (event, profile, userContext) => {
        if (!(await ensureLicensedSession())) {
            return false;
        }

        const token = getCredentials().cloudToken || '';
        if (!token.trim()) {
            sendToRenderer('update-status', 'Cloud token not configured.');
            return false;
        }

        try {
            currentProviderMode = 'cloud';
            initializeNewSession(profile);
            setOnTurnComplete((transcription, response) => {
                saveConversationTurn(transcription, response);
            });
            sendToRenderer('session-initializing', true);
            await connectCloud(token, profile, userContext);
            sendToRenderer('session-initializing', false);
            return true;
        } catch (err) {
            console.error('[Cloud] Init error:', err);
            currentProviderMode = 'byok';
            sendToRenderer('session-initializing', false);
            return false;
        }
    });

    ipcMain.handle('initialize-gemini', async (event, customPrompt, profile = 'sales', language = 'en-US') => {
        if (!(await ensureLicensedSession())) {
            return false;
        }

        const apiKey = getApiKey();
        if (!apiKey || !apiKey.trim()) {
            sendToRenderer('update-status', 'Add your Gemini API key on the home screen.');
            return false;
        }

        currentProviderMode = 'byok';
        const session = await initializeGeminiSession(apiKey, customPrompt, profile, language);
        if (session) {
            geminiSessionRef.current = session;
            return true;
        }
        return false;
    });

    ipcMain.handle('initialize-local', async (event, localLlmModel, whisperModel, profile, customPrompt) => {
        if (!(await ensureLicensedSession())) {
            return false;
        }

        currentProviderMode = 'local';
        const success = await getLocalAi().initializeLocalSession(localLlmModel, whisperModel, profile, customPrompt);
        if (!success) {
            currentProviderMode = 'byok';
        }
        return success;
    });

    ipcMain.handle('initialize-whisper-openrouter', async (event, whisperModel, profile, customPrompt) => {
        if (!(await ensureLicensedSession())) {
            return false;
        }

        if (!hasOpenRouterKey()) {
            sendToRenderer(
                'update-status',
                'Add your OpenRouter key on the home screen, or choose a pass with included AI.'
            );
            return false;
        }

        currentProviderMode = 'whisper_openrouter';
        currentSystemPrompt = getSystemPrompt(profile, customPrompt || '', false);
        const success = await getLocalAi().initializeWhisperOpenRouterSession(whisperModel, profile, customPrompt || '');
        if (!success) {
            currentProviderMode = 'byok';
            currentSystemPrompt = null;
        }
        return success;
    });

    ipcMain.handle('cancel-local-initialization', async () => {
        const cancelled = await getLocalAi().cancelLocalInitialization();
        if (cancelled) {
            currentProviderMode = 'byok';
        }
        return cancelled;
    });

    ipcMain.handle('send-audio-content', async (event, { data, mimeType }) => {
        if (currentProviderMode === 'cloud') {
            try {
                const pcmBuffer = Buffer.from(data, 'base64');
                sendCloudAudio(pcmBuffer);
                return { success: true };
            } catch (error) {
                console.error('Error sending cloud audio:', error);
                return { success: false, error: error.message };
            }
        }
        if (usesLocalWhisper()) {
            try {
                const pcmBuffer = Buffer.from(data, 'base64');
                getLocalAi().processLocalAudio(pcmBuffer);
                return { success: true };
            } catch (error) {
                console.error('Error sending local audio:', error);
                return { success: false, error: error.message };
            }
        }
        if (!geminiSessionRef.current) return { success: false, error: 'No active Gemini session' };
        try {
            process.stdout.write('.');
            await geminiSessionRef.current.sendRealtimeInput({
                audio: { data: data, mimeType: mimeType },
            });
            return { success: true };
        } catch (error) {
            console.error('Error sending system audio:', error);
            return { success: false, error: error.message };
        }
    });

    // Handle microphone audio on a separate channel
    ipcMain.handle('send-mic-audio-content', async (event, { data, mimeType }) => {
        if (currentProviderMode === 'cloud') {
            try {
                const pcmBuffer = Buffer.from(data, 'base64');
                sendCloudAudio(pcmBuffer);
                return { success: true };
            } catch (error) {
                console.error('Error sending cloud mic audio:', error);
                return { success: false, error: error.message };
            }
        }
        if (usesLocalWhisper()) {
            try {
                const pcmBuffer = Buffer.from(data, 'base64');
                getLocalAi().processLocalAudio(pcmBuffer);
                return { success: true };
            } catch (error) {
                console.error('Error sending local mic audio:', error);
                return { success: false, error: error.message };
            }
        }
        if (!geminiSessionRef.current) return { success: false, error: 'No active Gemini session' };
        try {
            process.stdout.write(',');
            await geminiSessionRef.current.sendRealtimeInput({
                audio: { data: data, mimeType: mimeType },
            });
            return { success: true };
        } catch (error) {
            console.error('Error sending mic audio:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('send-image-content', async (event, { data, prompt }) => {
        try {
            if (!data || typeof data !== 'string') {
                console.error('Invalid image data received');
                return { success: false, error: 'Invalid image data' };
            }

            const buffer = Buffer.from(data, 'base64');

            if (buffer.length < 1000) {
                console.error(`Image buffer too small: ${buffer.length} bytes`);
                return { success: false, error: 'Image buffer too small' };
            }

            process.stdout.write('!');

            if (currentProviderMode === 'cloud') {
                const sent = sendCloudImage(data);
                if (!sent) {
                    return { success: false, error: 'Cloud connection not active' };
                }
                return { success: true, model: 'cloud' };
            }

            if (currentProviderMode === 'local') {
                const result = await getLocalAi().sendLocalImage(data, prompt);
                return result;
            }

            if (currentProviderMode === 'whisper_openrouter') {
                const geminiKey = getApiKey();
                if (geminiKey) {
                    return await sendImageToGeminiHttp(data, prompt);
                }
                return await sendImageToOpenRouter(data, prompt);
            }

            // Gemini Live / BYOK: prefer direct Gemini HTTP when a key is configured.
            const result = await sendImageToGeminiHttp(data, prompt);
            return result;
        } catch (error) {
            console.error('Error sending image:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('send-text-message', async (event, text) => {
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return { success: false, error: 'Invalid text message' };
        }

        if (currentProviderMode === 'cloud') {
            try {
                console.log('Sending text to cloud:', text);
                sendCloudText(text.trim());
                return { success: true };
            } catch (error) {
                console.error('Error sending cloud text:', error);
                return { success: false, error: error.message };
            }
        }

        if (usesLocalWhisper()) {
            try {
                console.log(
                    currentProviderMode === 'whisper_openrouter'
                        ? 'Sending text via Whisper+OpenRouter path:'
                        : 'Sending text to local Llama:',
                    text
                );
                return await getLocalAi().sendLocalText(text.trim());
            } catch (error) {
                console.error('Error sending local/hybrid text:', error);
                return { success: false, error: error.message };
            }
        }

        if (!geminiSessionRef.current) return { success: false, error: 'No active Gemini session' };

        try {
            console.log('Sending text message:', text);

            if (hasOpenRouterKey()) {
                openRouterRequestStartedForTurn = true;
                sendToOpenRouter(text.trim());
            }

            await geminiSessionRef.current.sendRealtimeInput({ text: text.trim() });
            return { success: true };
        } catch (error) {
            console.error('Error sending text:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('start-macos-audio', async event => {
        if (process.platform !== 'darwin') {
            return {
                success: false,
                error: 'macOS audio capture only available on macOS',
            };
        }

        try {
            const success = await startMacOSAudioCapture(geminiSessionRef);
            return { success };
        } catch (error) {
            console.error('Error starting macOS audio capture:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('stop-macos-audio', async event => {
        try {
            stopMacOSAudioCapture();
            return { success: true };
        } catch (error) {
            console.error('Error stopping macOS audio capture:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('close-session', async event => {
        try {
            stopMacOSAudioCapture();

            if (currentProviderMode === 'cloud') {
                closeCloud();
                currentProviderMode = 'byok';
                closeTransportLog();
                return { success: true };
            }

            if (usesLocalWhisper()) {
                getLocalAi().closeLocalSession();
                currentProviderMode = 'byok';
                closeTransportLog();
                return { success: true };
            }

            // Set flag to prevent reconnection attempts
            isUserClosing = true;
            sessionParams = null;

            // Cleanup session
            if (geminiSessionRef.current) {
                await geminiSessionRef.current.close();
                geminiSessionRef.current = null;
            } else {
                closeTransportLog();
            }

            return { success: true };
        } catch (error) {
            console.error('Error closing session:', error);
            return { success: false, error: error.message };
        }
    });

    // Conversation history IPC handlers
    ipcMain.handle('get-current-session', async event => {
        try {
            return { success: true, data: getCurrentSessionData() };
        } catch (error) {
            console.error('Error getting current session:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('start-new-session', async event => {
        try {
            initializeNewSession();
            return { success: true, sessionId: currentSessionId };
        } catch (error) {
            console.error('Error starting new session:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('update-google-search-setting', async (event, enabled) => {
        try {
            updatePreference('googleSearchEnabled', Boolean(enabled));
            console.log('Google Search setting updated to:', Boolean(enabled));
            return { success: true };
        } catch (error) {
            console.error('Error updating Google Search setting:', error);
            return { success: false, error: error.message };
        }
    });
}

module.exports = {
    initializeGeminiSession,
    getEnabledTools,
    isGoogleSearchEnabled,
    sendToRenderer,
    initializeNewSession,
    saveConversationTurn,
    getCurrentSessionData,
    killExistingSystemAudioDump,
    startMacOSAudioCapture,
    convertStereoToMono,
    stopMacOSAudioCapture,
    sendAudioToGemini,
    sendImageToGeminiHttp,
    sendToOpenRouter,
    setupGeminiIpcHandlers,
    formatSpeakerResults,
};
