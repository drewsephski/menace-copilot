# Desktop updates

Menace Agent 1.0.1 introduced the in-app installer. Version 1.0.2 improves update error guidance and voice response latency. Apps older than 1.0.1 still need a one-time manual installation because they do not include the installer.

## Release contract

- Apple Silicon macOS only for this release pipeline. Other platforms show updates unavailable.
- Uses Electron 30's native `autoUpdater` (Squirrel.Mac), with the official public update service at `https://update.electronjs.org/drewsephski/menace-copilot/darwin-arm64/<installed-version>`.
- The publisher and platform are fixed in `src/config/updateSource.js`, shipped inside the signed ASAR. Legacy `MENACE_UPDATE_MANIFEST_URL` and `MENACE_RELEASE_PAGE_URL` do not control installation.
- The service selects stable, non-draft, non-prerelease GitHub releases with a numeric SemVer tag and a matching macOS ZIP. No custom JSON manifest, `latest.yml`, or GitHub token is installed in the app.
- Keep ZIP names in `Menace-Agent-X.Y.Z-darwin-arm64.zip` format. DMG is for fresh installation, ZIP is for the updater. Both are generated from the same signed, stapled app.
- Native Squirrel checks signatures before replacement; preserve `com.menaceagent.app` and Developer ID team `2NHJGX6A7S` across releases.
- Checks run at startup and hourly. Multiple controls share one main-process operation. Native Electron automatically downloads an available update. It exposes download state, not byte progress; the UI does not invent a percentage.
- Errors permit retry after native failure. A stalled native operation remains single-flight until it finishes or the app is restarted.
- Restart requires an explicit choice; Later retains the downloaded update. Squirrel may apply a downloaded update on the next normal app launch as well.
- Data remains outside the app bundle in the existing config directory. The release version does not change `CONFIG_VERSION`, encrypted credential format or history paths.

## Local release workflow

Build and sign releases on the Mac that holds the existing Developer ID Application identity. GitHub Releases hosts the finished files; GitHub Actions and GitHub-stored Apple credentials are not required for in-app updating.

1. Bump the app version in `package.json` and root package-lock metadata, then update `docs/desktop-release-notes.md`.
2. Run `pnpm run check`.
3. Build with `pnpm run beta:macos`. Set `APPLE_NOTARY_PROFILE` to an Apple `notarytool` keychain profile, or provide `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` in the ignored local `.env`. Do not export signing credentials to GitHub.
4. The build stages the versioned ZIP, DMG and SHA256SUMS under `out/release/`. Verify signatures, the notarization ticket and checksums before publishing.
5. When a release is requested, upload those exact artifacts to a stable GitHub release in `drewsephski/menace-copilot`, with a matching `vX.Y.Z` tag. Stage a draft first, re-download and verify checksums, then publish it.
6. The app discovers published stable releases through the official Electron update service. Verify a higher version from an older installed app, including download, restart and retained data.

No Apple credentials are needed by the installed app. Locally installing the bootstrap does not publish a release. Until a higher version is uploaded, there is no remote update to install; an empty release repository may return a check error.

## Local checks

`pnpm run check` runs syntax, architecture checks and tests (including updater state, errors, retry, IPC trust and restart confirmation). This JavaScript repository has no `typecheck` script.

`pnpm run beta:macos` is the notarized release path. `SKIP_NOTARIZE=1 pnpm run beta:macos` is only for a signed local test build, never a public release.

`node scripts/checks/test-native-updater-macos.js` runs the native Squirrel engine against isolated signed fixtures. It verifies no update, rejects a broken ZIP and an ad-hoc signed replacement, then installs a matching Developer ID build, relaunches at the higher version, and checks fixture data. It requires the local Developer ID signing identity and keeps fixtures in a temporary directory. Loopback HTTP and timestamp-free signing are confined to this test; public releases still require HTTPS and notarization.

A real public acceptance test requires two versions: install the bootstrap, publish a higher version, trigger Check for updates, choose Restart to update, and inspect the running installed version. Controller tests and a local rebuilt app do not prove that public lifecycle.
