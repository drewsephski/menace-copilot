# Menace Agent

**Know what to say next.**

Menace listens to the conversation, understands what's on screen, and gives you concise, ready-to-speak responses in real time. Built for sales calls, meetings, interviews, negotiations, presentations, and custom workflows.

> [!NOTE]
> Use the latest macOS. Older versions have limited system-audio support.

> [!NOTE]
> During testing it will not answer if you ask something yourself. Simulate another participant asking a question — that is what it answers.

## Features

- **Included AI + local Whisper**: paid users get hosted answers; on-device transcription
- **Screen & audio capture**: contextual help from what you see and hear
- **Session profiles**: Sales Call (default), Meeting, Interview, Negotiation, Presentation, Custom
- **Per-profile context**: keep sales battlecards separate from interview prep
- **Conversation autocue overlay**: compact always-on-top window with click-through
- **First-run setup**: activate your pass, grant macOS permissions, optional session context

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
2. On Home, choose a session type and add context
3. Click **Start Sales Call** (or your selected session type)
4. Position the compact overlay with keyboard shortcuts
5. Speak from the ready-to-say lines while the conversation continues

## Keyboard Shortcuts

- **Window Movement**: `Ctrl/Cmd + Arrow Keys`
- **Click-through**: `Ctrl/Cmd + M`
- **Close/Back**: `Ctrl/Cmd + \`
- **Send Message**: `Enter`

## Audio Capture

- **macOS**: SystemAudioDump helper for system audio
- **Windows**: Loopback audio capture
- **Linux**: Microphone input

On **macOS 26+**, other participants' audio needs **System Settings → Privacy & Security → Screen & System Audio Recording**. When running with `npm start`, enable **Electron** (not only the packaged Menace Agent app). If capture stays silent, also check **System Audio Recording Only**.

## Requirements

- macOS (primary), Windows/Linux secondary
- Active Menace Agent pass (or `MENACE_SKIP_LICENSE=1` in dev)
- Screen recording permissions
- Microphone/audio permissions when mic mode is enabled
