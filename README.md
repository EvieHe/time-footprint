# 时迹 · Time Footprint

A calm, local-first Electron desktop app for recording what actually happened in your day, inspired by Tide's immersive design language, but with a distinctive **24-hour time footprint** as the home screen.

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
