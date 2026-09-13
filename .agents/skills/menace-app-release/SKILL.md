---
name: menace-app-release
description: Builds, signs, publishes, and verifies Menace Agent macOS releases that installed apps can discover and install through the in-app updater. Use when asked to publish an app update, release a new version, or rebuild the downloaded Menace app for in-app updates.
disable-model-invocation: true
---

# Menace App Release

Make the requested version available through the installed app's update flow. A local `.app` rebuild, copying into Applications, a Vercel deployment, and uploading CI artifacts are separate steps; none alone proves a published desktop update works.

## Scope and authorization

- This skill belongs to the `cheating-daddy` / Menace Agent Electron repository. Resolve the checkout and re-read its `AGENTS.md`, package scripts, Git remote, and updater before acting.
- Creating or reviewing this skill does not authorize a release. When the user explicitly asks to publish an update, carry the requested build, versioning, release publication, feed update, and verification through without repeatedly asking for the same permission.
- Infer the established repository, channel, and release destination from verified configuration. Ask only for genuinely missing choices or authorization. Prepare a concrete artifact before any final publication approval that is still required.
- Preserve dirty work, installed user settings, encrypted credentials, history, and the prior working release. Do not stash, reset, or include unrelated changes to manufacture a clean release.

## 1. Inspect the actual update path

Run the read-only helper from the repository root:

```sh
node .agents/skills/menace-app-release/scripts/inspect-release.cjs --repo . --app "$HOME/Applications/Menace Agent.app"
```

The helper reports configuration and source observations; its successful exit is not release readiness. Read [release-reference.md](release-reference.md) for the implementation map, commands, and known traps.

Compare:

- The installed version and its **bundled** `Contents/Resources/menace-runtime-config.json`.
- The source version, public feed's latest version, release assets, and target platform/architecture.
- `src/utils/updateChecker.js`, `src/index.js` update IPC handlers, and update buttons in both app shells.
- Signing identity, notarization prerequisites, artifact scripts, and CI publication steps.

Do not print `.env` values, Keychain secrets, license keys, provider tokens, or full process arguments. Check credential presence by name/boolean; use credentials only through their existing authorized integration.

## 2. Bootstrap missing in-app updating

Version 1.0.1 uses the native Electron autoUpdater through `src/utils/updateChecker.js`, secure IPC in `src/utils/updateIpc.js`, and `AppUpdater.js`. Confirm this remains the current implementation. See `docs/desktop-updates.md` for the exact release contract.

If the requested outcome is installing updates **inside the app**, implement the missing updater before declaring this workflow complete. Merely adding a release URL does not meet that outcome. Reuse an existing updater if one has since been added; otherwise select an Electron-supported updater after checking official documentation for the installed Electron version.

The implementation must include:

- A stable HTTPS feed scoped to the verified Menace release repository, baked into the signed app. Never embed GitHub, Apple, or provider credentials in desktop configuration.
- Version comparison and architecture/channel-aware artifact selection using the selected updater's actual metadata format.
- Validated main-process IPC, visible check/download/progress/error states, and a verified install/relaunch action. Keep installation out of the renderer and do not execute shell commands supplied by a manifest.
- Artifact authenticity/integrity checks supported by the updater, matching signing identity, interrupted-download recovery, and protection against partial or invalid installations.
- Preservation of app data and settings. Let the user choose when to restart if a conversation is active.
- Focused tests for no update, newer release, malformed/unreachable feed, invalid artifact, failed download, installation, and settings preservation.

An already-installed app with null update URLs or no installer cannot acquire this capability from a remote manifest alone. Deliver one updated bootstrap installer, get that installed, then prove a subsequent version is discoverable and installable from inside it. Explain that one-time step plainly.

## 3. Prepare the release

1. Resolve the requested source state and inspect the diff that will ship. Reuse existing authorization for Git operations; do not publish unrelated changes.
2. Choose the next numeric stable version higher than both the installed app and the public feed. Reuse a user-specified version. Use plain numeric stable tags: the official public update service excludes prereleases.
3. Synchronize `package.json`, root package-lock metadata when present, and applicable pnpm metadata without switching package managers or changing dependency versions unnecessarily.
4. Ensure packaged `CFBundleShortVersionString` and `CFBundleVersion` represent this release. The manual packager historically set only the former; inspect and repair that omission before publishing.
5. Verify `src/config/updateSource.js` points to the intended Menace repository. Native updates use the fixed official Electron feed; legacy runtime manifest/release URL variables do not control the installer.
6. Run `pnpm run lint` and `pnpm run check`. Run type checking if the repository now defines it; otherwise state that the script is absent. Run focused updater tests and resolve failures.
7. If a hosted model/API change is part of this release, verify/deploy the relevant `site/` gateway within the authorized scope. Verify a valid-license provider response separately from desktop packaging.

## 4. Build distributable artifacts

- Use the repository's pnpm lockfile and current supported Node runtime; Node 24 is the established fallback for this checkout's packaging scripts.
- Prefer `pnpm run beta:macos`, which signs, notarizes, staples, verifies, and creates release artifacts. Inspect the script before running: it replaces its output directory.
- Restore the exact Electron archive required by the current packager if its cache is missing; do not silently upgrade Electron during a release.
- For public releases, do not use `SKIP_NOTARIZE=1` as a substitute for notarization. That option is for an explicitly local/test artifact. If credentials are missing, finish reversible preparation and report the precise remaining prerequisite.
- Verify ASAR source contents match the intended release, packaged runtime URLs are present, secrets are absent, nested code signatures pass, the stapled ticket is valid, and Gatekeeper accepts the app.
- Produce the ZIP/metadata required by the chosen updater and a DMG for fresh installs. Build both from the same final signed/stapled bundle. Do not modify signed contents afterward.
- Keep stable versioned asset names and compute checksums. Confirm every artifact belongs to this build, rather than selecting an old file by filename sorting.

## 5. Publish artifacts, then advertise the update

1. Re-read the Git remote and verify the release destination and visibility. The established remote is `drewsephski/menace-copilot`; do not assume that remains current or use upstream `sohzm/cheating-daddy`.
2. Prepare the release notes and versioned artifact list. Prefer a draft release for staging when publication is authorized. Use a body file for multiline GitHub release notes and do not overwrite an existing release's assets silently.
3. Publish the tested release assets, verify their final unauthenticated download URLs and checksums, and only then promote the public feed/latest pointer.
4. Write the exact metadata format consumed by the shipped updater. The legacy checker reads only `{ "version": "X.Y.Z" }`; that is insufficient metadata for an installer.
5. Verify cache behavior and content types so the feed advertises the intended version and assets download as binaries rather than HTML or a login page.
6. Keep the prior release downloadable. If verification fails after publication, correct or withdraw the bad feed/asset promotion within authorization. A lower feed version does not roll back apps already updated; ship a higher corrective version if needed.

## 6. Prove the installed-app experience

- Begin with an older installed build configured for this feed. Do not overwrite it with the new bundle as a shortcut to updater testing.
- Use the app's update control and observe the new version, download progress, completed verification, install/relaunch, and the new running version.
- If checks currently happen only at startup, relaunch to trigger discovery and add a usable manual check control if the requested UX requires it.
- Confirm the running executable is the installed app, not a development process or build-output copy. Check that settings, license access, and history survive.
- Verify the requested change in the updated app. For an AI-model release, verify the packaged model policy and actual hosted model response, not just a `200` homepage.
- Do not claim end-to-end updating if only the feed or download page was tested. Name the exact unverified step.

## Completion report

Report the release version, public release/download link, feed URL, signing/notarization status, and evidence of the installed update/relaunch. Include any one-time bootstrap install or remaining blocker. Be concise and distinguish local artifacts from published availability.

## Invocation examples

- `$menace-app-release Publish the latest Menace changes so my installed app can update itself.`
- `$menace-app-release Prepare the next release without publishing it.`
- `$menace-app-release Check why the published version does not appear in my app.`
