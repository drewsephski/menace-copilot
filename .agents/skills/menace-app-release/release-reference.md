# Menace release reference

The current release contract and credential setup are documented in [desktop-updates.md](../../../docs/desktop-updates.md), relative to this skill folder.

- `src/config/updateSource.js`: fixed official Electron public feed, scoped to `drewsephski/menace-copilot`, darwin-arm64, stable numeric version.
- `src/utils/updateChecker.js`: single main-process native updater controller with retry and download/ready/error states.
- `src/utils/updateIpc.js`, `src/preload.js`: trusted main-frame IPC, no renderer-supplied URLs, explicit Restart/Later choice.
- `src/components/app/AppUpdater.js`: reusable visible manual check and status control in both app shells.
- `.github/workflows/beta-release.yml`: pnpm/Node 24 tag-triggered signing, notarization, fresh assets, draft download/checksum verification then publication.
- `scripts/beta-release-macos.js`, `scripts/stage-macos-release.js`: ZIP and DMG from the same signed/stapled bundle, stable versioned names, SHA256SUMS. CI does not fall back to manual packaging.
- `forge.config.js`: app version/build version, signed bundle ID `com.menaceagent.app`, Developer ID team `2NHJGX6A7S`, allowlisted packaged inputs, correct pre-sign runtime config/audio helper placement.
- `scripts/package-macos-manual.js`: local fallback; both bundle versions match the package version. Do not claim CI-equivalent fuse proof for this fallback.
- `scripts/checks/verify-packaged-artifact.js`: packaged secret scan.

The native updater uses Squirrel.Mac's default feed protocol, served by `https://update.electronjs.org/drewsephski/menace-copilot/darwin-arm64/<version>`. GitHub Releases require a stable `vX.Y.Z` tag and `Menace-Agent-X.Y.Z-darwin-arm64.zip`. Do not generate electron-builder `latest.yml` metadata. `MENACE_UPDATE_MANIFEST_URL` and `MENACE_RELEASE_PAGE_URL` are legacy runtime fields and do not configure installation.

An installed 1.0.0 build cannot bootstrap itself; install 1.0.1 or later once, then test a higher version through its updater. A null legacy manifest URL alone does not mean a 1.0.1+ app lacks an updater: inspect its signed ASAR.

Local app: `$HOME/Applications/Menace Agent.app`. Inspect the actual running executable and keep the old app and user data intact. Never use the destructive install helper blindly.

Run `PATH="/opt/homebrew/opt/node@24/bin:$PATH" pnpm run check`; no typecheck script exists. Public releases use `pnpm run beta:macos` with all required Apple credentials. `SKIP_NOTARIZE=1` is local/test-only.
