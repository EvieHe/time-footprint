# Time Footprint Mobile · iOS / Android

This project **keeps Electron** and builds mobile apps from the same React renderer using Capacitor 8. The mobile bridge uses native SQLite (`@capacitor-community/sqlite`) and provides the same `window.activityAPI` contract as the Electron preload layer. Data is device-local, and each platform has its own database until a deliberate sync layer is added.

## Native setup

Node.js 22+, Xcode (iOS on macOS), Android Studio + Android SDK (Android).

```sh
npm install
npm run build
npx cap add ios          # once, on a Mac with Xcode
npx cap add android      # once
npm run mobile:sync
npm run mobile:ios       # opens Xcode
npm run mobile:android   # opens Android Studio
```

When building updates, run `npm run build && npm run mobile:sync` before building from Xcode / Android Studio. Do **not** execute `npm run start` for mobile: that starts Electron.

## Functional mapping

- Weekly 24-hour footprint and daily reflection: same React views, with a mobile bottom navigation bar and touch-specific sizing.
- Start / pause / resume / stop, optional intentions and reflections, activity history, manual entry/edit/delete: shared activityAPI methods backed by native SQLite.
- Timer display: elapsed time is reconstructed from stored wall-clock timestamps, including after the app has been backgrounded or terminated, rather than relying on background JS intervals.
- Ambient sounds: existing Web Audio rain/ocean/wind mixer, activated by direct user touch while the app is in the foreground.
- Mobile resume: native app state change triggers fresh SQLite read; sessions that were running continue by timestamp, and the app warns if more than a minute elapsed while backgrounded.

## Scope and limitations

- **Not yet equivalent to a production Tide native app:** mobile background audio under a locked screen is not guaranteed. iOS can suspend Web Audio after app enters the background; proper lock-screen playback requires a native audio engine and background audio entitlement. Foreground playback works subject to device WebView support.
- No cross-device cloud synchronization yet. Electron SQLite data and mobile SQLite data are separate.
- No signed iOS IPA, App Store distribution, Android production signing, or physical-device smoke test has been completed in this environment.
- Existing UI uses a shared design system but controls and navigation are adapted for smaller screens (not pixel-identical).
- Device screen sleep/background is not inferred as an automatic activity pause; users should review elapsed time after returning.

## Validation

Run `npm run test:mobile` to test the model and SQLite persistence using a real in-memory SQLite database (Node 22 built-in sqlite adapter). This is a database-contract test, **not** a replacement for testing Capacitor plugin versions and physical device behavior.

For a debug Android APK, `npm run build && npx cap add android && npx cap sync android && cd android && ./gradlew assembleDebug`. Android Studio is recommended for iterative UI/animation verification.
