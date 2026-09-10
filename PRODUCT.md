# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user is an interview candidate sitting at a Mac during a live video interview. They need spoken answers in the moment without leaving the call. Other session profiles remain available: sales call, business meeting, presentation, negotiation.

## Product Purpose

Menace Agent is a desktop overlay that listens to the interviewer, watches the screen, and supplies short ready-to-speak answers in real time. Success is a first-time download that reaches a working session: OpenRouter key in, local Whisper ready, macOS screen and system-audio permissions granted, then a compact overlay that does not steal the call.

## Positioning

Setup happens in a normal Mac window. Once a session starts, the app collapses into a compact always-on-top overlay with click-through so the candidate can keep the interview in front. The default path is OpenRouter for language and a local Whisper model for speech, so transcription stays on-device while answers come from the user’s own key.

## Operating Context

Electron desktop app, packaged for macOS as a downloaded install. Used over Zoom, Meet, and similar call windows. Requires Screen & System Audio Recording (and System Audio Recording Only on newer macOS), plus an OpenRouter API key. Local Whisper downloads on first use. Keyboard shortcuts move the overlay, toggle click-through, send text, and go back. Config lives in Application Support.

## Capabilities and Constraints

Confirmed:
- Rebrand from Cheating Daddy to Menace Agent; functionality stays complete.
- Default provider path: OpenRouter + local Whisper (not Gemini Live as the first-run default).
- Session profiles: interview (default), sales, meeting, presentation, negotiation.
- Screen capture, system-audio capture via a macOS helper, optional microphone.
- Custom context (resume, job description) collected at onboarding and later in settings.
- History of sessions; help; customization of prompts, keybinds, layout, transparency, screenshot interval.
- Click-through overlay, window movement shortcuts, always-on-top during a session.
- Production-ready macOS package from a downloaded install: signed app identity, permissions copy, first-run Whisper download, OpenRouter key as the setup gate.
- Design language is web (Lit + HTML/CSS inside Electron), not native AppKit.

Undecided:
- Notarization / Gatekeeper flow for machines that have never opened the developer’s builds.
- Whether local LLM remains a first-class alternate or an advanced option only.

## Brand Commitments

- Product name: Menace Agent.
- Keep some of the original playful personality under the new name. Do not go fully corporate or humorless; do not keep “daddy”-era naming.
- No existing logo kit was provided; the current Cheating Daddy mark is evidence only, not authority.

## Evidence on Hand

- Working Electron app in `src/` with onboarding, main setup, customize, history, help, feedback, and live assistant views.
- macOS audio helper at `src/assets/CheatingDaddyAudio.app`.
- Existing icon assets at `src/assets/logo.png`, `logo.icns`, `logo.ico` (old product identity).
- Do not fabricate customers, benchmarks, pricing, or third-party endorsements.

## Product Principles

1. First-run must reach a live interview session without a developer machine.
2. Setup is a normal app; the live session is a stealth overlay.
3. Interview is the primary job; other profiles stay, they do not lead.
4. Transcription prefers local Whisper; answers prefer the user’s OpenRouter key.
5. Playful, not corporate — and not the old name.

## Accessibility & Inclusion

Keyboard-operable overlay controls already exist and must remain. No additional product-specific accessibility standard was established.
