# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are professionals in high-stakes live conversations: sales calls, business meetings, job interviews, negotiations, and presentations. They need concise, ready-to-speak responses in the moment without leaving the call. Sales is the default commercial entry point; the product is not limited to a single use case.

## Product Purpose

Menace Agent is a desktop overlay that listens to the conversation, understands what's on screen, and supplies short ready-to-speak answers in real time.

**Core promise:** Know what to say next.

Success is a first-time download that reaches a working session: pass activated, local Whisper ready, macOS screen and system-audio permissions granted, then a compact overlay that does not steal the call.

## Positioning

Setup happens in a normal Mac window. Once a session starts, the app collapses into a compact always-on-top overlay with click-through so the user can keep the conversation in front. The default path is OpenRouter for language and a local Whisper model for speech, so transcription stays on-device while answers come from the user's pass or their own keys.

## Operating Context

Electron desktop app, packaged for macOS as a downloaded install. Used over Zoom, Meet, and similar call windows. Requires Screen & System Audio Recording (and System Audio Recording Only on newer macOS), plus an active pass or configured API keys. Local Whisper downloads on first use. Keyboard shortcuts move the overlay, toggle click-through, send text, and go back. Config lives in Application Support.

## Capabilities and Constraints

Confirmed:

- Rebrand from Cheating Daddy to Menace Agent; functionality stays complete.
- Default provider path: OpenRouter + local Whisper (not Gemini Live as the first-run default).
- Session profiles: sales (default), meeting, interview, negotiation, presentation, custom.
- Per-profile session context stored independently (product info, agenda, resume, etc.).
- Screen capture, system-audio capture via a macOS helper, optional microphone.
- History of sessions; help; customization of keybinds, layout, transparency, screenshot interval.
- Click-through overlay, window movement shortcuts, always-on-top during a session.
- Production-ready macOS package from a downloaded install: signed app identity, permissions copy, first-run Whisper download, pass as the setup gate.
- Design language is web (Lit + HTML/CSS inside Electron), not native AppKit.

Undecided:

- Notarization / Gatekeeper flow for machines that have never opened the developer's builds.
- Whether local LLM remains a first-class alternate or an advanced option only.

## Brand Commitments

- Product name: Menace Agent.
- Tagline: Know what to say next.
- Keep some playful personality under the new name. Do not go fully corporate or humorless.
- No fabricated customers, benchmarks, pricing claims beyond published passes, or third-party endorsements.

## Product Principles

1. First-run must reach a live session without a developer machine.
2. Setup is a normal app; the live session is a stealth overlay.
3. Sales leads go-to-market examples; other profiles remain first-class.
4. Transcription prefers local Whisper; answers prefer the user's pass or OpenRouter key.
5. The live overlay is a prompter, not a dashboard.

## Accessibility & Inclusion

Keyboard-operable overlay controls already exist and must remain. No additional product-specific accessibility standard was established.
