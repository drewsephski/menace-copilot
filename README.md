# Menace Agent

A live interview autocue for macOS. It listens with local Whisper, answers through your OpenRouter key, and collapses into a compact always-on-top prompter once a session starts.

> [!NOTE]
> Use the latest macOS. Older versions have limited system-audio support.

> [!NOTE]
> During testing it will not answer if you ask something yourself. Simulate an interviewer asking a question — that is what it answers.

## Features

- **Included AI + local Whisper**: paid users get hosted answers; on-device transcription
- **Screen & audio capture**: contextual help from what you see and hear
- **Profiles**: Interview (default), Sales Call, Business Meeting, Presentation, Negotiation
- **Talent autocue overlay**: compact always-on-top window with click-through
- **First-run setup**: activate your pass, grant macOS permissions, optional resume context

## Setup (development)

1. Copy `.env.example` to `.env` and set `OPENROUTER_API_KEY` (powers included AI for licensed users)
2. `npm install`
3. `npm start` or on macOS `npm run start:macos`

For local testing without Polar, set `MENACE_SKIP_LICENSE=1` in `.env`.

### Polar production

1. Create the **Menace** org and products on [polar.sh](https://polar.sh) (not sandbox).
2. Add your production org token to `.env`:

   ```
   POLAR_ACCESS_TOKEN=polar_pat_...
   POLAR_SERVER=production
   ```

3. Sync checkout URLs into the app:

   ```
   npm run polar:sync
   ```

4. Verify hosted AI + license path:

   ```
   npm run test:license-flow
   # or, after a real checkout:
   npm run test:license-flow -- MENACE_your_key_here
   ```

## Production macOS install

```bash
# OPENROUTER_API_KEY must be set in .env (or the shell) so packaged builds include hosted AI
npm run package:macos
npm run install:macos
```

The packaged app installs to `~/Applications/Menace Agent.app`. Enable it under **System Settings → Privacy & Security → Screen & System Audio Recording** (and **System Audio Recording Only** on macOS 26+).

To build a distributable DMG:

```bash
npm run make:macos
```

Artifacts land in `out/`.

## Usage

1. Complete onboarding (activate pass + permissions)
2. Confirm Whisper model on Home (default: Base English)
3. Click **Start Session**
4. Position the compact overlay with keyboard shortcuts
5. Speak from the ready-to-say lines while the interviewer talks

## Keyboard Shortcuts

- **Window Movement**: `Ctrl/Cmd + Arrow Keys`
- **Click-through**: `Ctrl/Cmd + M`
- **Close/Back**: `Ctrl/Cmd + \`
- **Send Message**: `Enter`

## Audio Capture

- **macOS**: SystemAudioDump helper for system audio
- **Windows**: Loopback audio capture
- **Linux**: Microphone input

On **macOS 26+**, interviewer audio needs **System Settings → Privacy & Security → Screen & System Audio Recording**. When running with `npm start`, enable **Electron** (not only the packaged Menace Agent app). If capture stays silent, also check **System Audio Recording Only**.

## Requirements

- macOS (primary), Windows/Linux secondary
- Active Menace Agent pass (or `MENACE_SKIP_LICENSE=1` in dev)
- Screen recording permissions
- Microphone/audio permissions when mic mode is enabled
