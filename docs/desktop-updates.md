# Desktop updates

Menace Agent 1.0.1 adds the first in-app installer. Install this bootstrap build once; an older app with the release-page-only checker cannot upgrade itself into the new installer.

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

## One-time GitHub setup

Set these in Settings → Secrets and variables → Actions for `drewsephski/menace-copilot`:

| Secret | Value |
| --- | --- |
| `MACOS_CERTIFICATE_P12_BASE64` | Base64 of the exported Developer ID Application identity, including its private key |
| `MACOS_CERTIFICATE_PASSWORD` | Password used to protect that P12 export |
| `APPLE_ID` | Apple ID authorized to notarize for this team |
| `APPLE_APP_SPECIFIC_PASSWORD` | Apple app-specific password for notarization |
| `APPLE_TEAM_ID` | `2NHJGX6A7S` |

Export the existing Developer ID Application identity from Keychain Access as a password-protected `.p12`. To copy its encoded value without printing it: `base64 -i /path/to/identity.p12 | pbcopy`. Paste into GitHub Secrets. Do not put credentials in repository files, chat, or public runtime configuration.

GitHub's built-in `GITHUB_TOKEN` handles release upload; no separate GitHub token is needed. The workflow imports the certificate into an ephemeral keychain and deletes it afterward. Public release builds cannot skip notarization.

## Publish a release

1. Update `package.json` version, the root metadata in `package-lock.json`, and `docs/desktop-release-notes.md`. The pnpm lockfile remains authoritative.
2. Run `pnpm run check` and review the release diff. Commit the intended source and push a matching numeric tag, e.g. `v1.0.2`.
3. The Desktop Release workflow on that tag checks, signs, notarizes, verifies, makes ZIP/DMG, and stages a draft GitHub release. It re-downloads the assets and verifies SHA-256 before publishing the release as latest.
4. `out/release/` contains the exact versioned assets and `SHA256SUMS`. A failed upload leaves a draft; inspect and remove the incomplete draft before retrying. Do not silently replace existing public assets.
5. Verify the public feed from an older installed app. Allow for update-service caching after publishing. Confirm checking → downloading → restart → new running version and retained settings/license/history.

Manual workflow runs must also target the matching version tag. CI artifacts by themselves are not a published update. Tag publication advertises the new version to all installed stable-channel clients.

## Local checks

`pnpm run check` runs syntax, architecture checks and tests (including updater state, errors, retry, IPC trust and restart confirmation). This JavaScript repository has no `typecheck` script.

`pnpm run beta:macos` is the notarized release path. `SKIP_NOTARIZE=1 pnpm run beta:macos` is only for a signed local test build, never a public release. CI fails rather than silently using the manual packaging fallback.

`node scripts/checks/test-native-updater-macos.js` runs the native Squirrel engine against isolated signed fixtures. It verifies no update, rejects a broken ZIP and an ad-hoc signed replacement, then installs a matching Developer ID build, relaunches at the higher version, and checks fixture data. It requires the local Developer ID signing identity and keeps fixtures in a temporary directory. Loopback HTTP and timestamp-free signing are confined to this test; public releases still require HTTPS and notarization.

A real public acceptance test requires two versions: install the bootstrap, publish a higher version, trigger Check for updates, choose Restart to update, and inspect the running installed version. Controller tests and a local rebuilt app do not prove that public lifecycle.
