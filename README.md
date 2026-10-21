# 时迹 · Time Footprint

**Desktop + Mobile:** Electron for macOS/Windows and Capacitor 8 for iOS/Android. Mobile installation steps and current limitations are in [docs/mobile.md](docs/mobile.md).

A calm, local-first Electron desktop app for recording what actually happened in your day, inspired by Tide's immersive design language, but with a distinctive **24-hour time footprint** as the home screen.

## Install on your own iPhone for free

A paid Apple Developer membership and TestFlight are **not required** for personal testing. On a Mac with Xcode 26+ and Node 22+, run:

```bash
git clone https://github.com/EvieHe/time-footprint.git
cd time-footprint
bash scripts/iphone.sh
```

The helper prepares Capacitor iOS, runs mobile tests, and opens Xcode. Sign in with an ordinary Apple Account, select **Personal Team** under **Signing & Capabilities**, connect your iPhone, then press **Run**. Free signing typically expires in 7 days. [Full step-by-step guide](docs/iphone-free-install.md).

## Core product flow

**Choose focus / meditation / reading / work → timer starts immediately → immersive space → optional intention → pause/resume → stop immediately → optional reflection → automatic day/week footprint.** There is no mandatory form before starting or after ending.

### Implemented source

- Seven horizontal 24-hour tracks (week) and a vertical 24-hour day timeline, editable history, and backfilling.
- One active session at a time, with pause intervals excluded from effective duration and visual footprint.
- Notes before/during and after a session; stop time is captured **before** the optional reflection form.
- React visual experience: Tide-inspired atmospheric gradients, soft breathing orb, slow transitions, and reduced-motion support.
- Three original, locally synthesized ambience channels: rain, ocean, and wind, with independent volume, instant presets, Web Audio fades, and mute.
- Electron main-process SQLite storage (`better-sqlite3`), context-isolated IPC, and tray persistence for hidden windows.
- Browser **visual demo mode** if the page is opened outside Electron; demo records are intentionally not SQLite-persistent.

## Development

Requires Node.js 20+ and a native build toolchain (`better-sqlite3` must be rebuilt for your Electron version).

```bash
npm install
npm run dev
```

```bash
npm test        # node built-in test runner, domain and audio-engine tests
npm run build   # Vite renderer production build
```

`npm run dev` starts Vite and Electron. For a packaged app, use an appropriate Electron packager and rebuild native dependencies for its target platform. Packaging has not yet been configured.

## Validation status

- **12 node tests passed** in the development container: transitions, pause subtraction, cross-midnight projection, recovery calculation, reversed manual ranges, serialization, invalid transitions, Web Audio mixing/fades, validation, and SQLite repository persistence via Node built-in SQLite compatibility shim.
- The target Electron/macOS window, native SQLite addon, and GUI interactions **have not been run end-to-end in this container** because installing external npm dependencies was not possible in the environment.
- SQLite persistence and secure IPC have source implementation but still need on-device smoke tests before the app is considered production-ready.

## Data boundaries

- All activity records stay in a local SQLite file under Electron's `userData` folder; no user account or telemetry.
- The nature-like audio is generated with Web Audio from random noise, not copied from Tide or third-party samples.
- Avoid distributing unlicensed audio/photo assets if expanding the product.
- Time uses absolute timestamps with local-day projection. For sessions left running when the laptop is asleep or the app quits, the app assumes elapsed time until explicitly stopped; users should review and correct such records.
- Sessions spanning midnight are split for display without duplicating the database record.

## Next validation milestones

1. On macOS, install dependencies and run start / pause / resume / stop / edit / backfill, then relaunch to check SQLite restoration.
2. Test audio on headphones: all three channels, independently, mixed, muted, faded on finish.
3. Verify DST, sleep/wake, and 24-hour day projection across timezone changes.
4. Add a signed DMG release workflow only after smoke tests.


## v0.4 interaction and desktop verification

- Week/day activity blocks share a single fixed-position custom tooltip, with keyboard focus and click-to-edit.
- Immersive controls are deliberately compact, with a separate spacious vertical ambient mixer and full-width channel sliders.
- Electron closes the window to the menu-bar tray. After a system suspend/resume, the renderer refreshes persisted sessions and warns when elapsed sleep exceeds one minute. Sleep time is **not silently removed** from tracked activity; users should review and correct sessions when necessary.
- Core tests: `npm test` (Node domain, SQLite integration and synthesized audio).
- Real Electron GUI regression suite: `npm run test:e2e` (requires dependencies, Electron runtime and a GUI display; on macOS it can be run locally). This test covers day/week navigation, direct focus start, and mixer open/close. A passing script does **not** by itself validate suspension or macOS notification behavior.
- Build: `npm run build`. Packaging/notarization and sleep/wake are subject to macOS manual verification.

## iPhone beta / TestFlight

- [iOS simulator CI](https://github.com/EvieHe/time-footprint/actions/workflows/mobile-ios-check.yml): macOS 26 + Xcode 26, builds and tests the Capacitor iOS shell **without signing**. First run [39590201067](https://github.com/EvieHe/time-footprint/actions/runs/39590201067) passed.
- [TestFlight publishing workflow](https://github.com/EvieHe/time-footprint/actions/workflows/mobile-ios-testflight.yml): **manual and credential-gated**; no Apple-signed IPA or TestFlight invitation exists until Apple Developer + App Store Connect setup is completed.
- [Exact Apple setup and secure GitHub Secrets instructions](docs/ios-testflight.md).
