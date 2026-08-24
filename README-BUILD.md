# CivicFix Pakistan — Android (Capacitor) Build Guide

This is a real, buildable Vite + React + Capacitor project. I can't run `npm install` or Android Studio/Gradle myself in this chat sandbox (no network, no Android SDK) — but everything is wired up so these commands work as-is on your machine. Follow this in order.

## 0. Prerequisites (install once)

- **Node.js 18+** — https://nodejs.org
- **Android Studio** (includes the Android SDK) — https://developer.android.com/studio
- A **JDK 17** (Android Studio bundles one; make sure `JAVA_HOME` points to it)

## 1. Install dependencies

```bash
cd civicfix-android
npm install
```

## 2. Run it in a browser first (fastest way to sanity-check)

```bash
npm run dev
```

Open the printed `localhost` URL. This runs in **local-only demo mode** — data lives in the browser's localStorage, exactly like the prototype you saw in chat. Login flow, categories, map, wallet, admin panel — all of it works.

## 3. Add the Android platform

```bash
npx cap add android
```

This generates the `android/` folder (a full Android Studio project) — it isn't pre-generated in this delivery because it needs your local Android SDK to scaffold correctly.

## 4. Add required permissions

Capacitor's generated manifest is minimal. Open `android/app/src/main/AndroidManifest.xml` and make sure these are present inside `<manifest>`, above `<application>`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

These map directly to the features in the app: the location pin picker (`ACCESS_FINE_LOCATION`), photo capture (`CAMERA`), and reverse-geocoding / backend sync (`INTERNET`).

## 5. App icon & splash screen

Replace `public/icon.svg` with your final artwork (or keep it), then generate all Android density buckets automatically:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --android
```

## 6. Build the web app and sync into Android

Every time you change `src/`, re-run this before opening Android Studio:

```bash
npm run cap:sync
```

## 7. Open in Android Studio, run on a device/emulator

```bash
npx cap open android
```

Press ▶ Run in Android Studio to install on a connected phone or emulator.

## 8. Wire up the real backend (before you go live)

Right now the app runs in local-only demo mode. To make citizen reports actually reach the admin dashboard:

1. Build the backend API against `civicfix_schema.sql` (the Postgres schema from the previous step).
2. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL=https://your-api-domain.com`.
3. Re-run `npm run cap:sync`.

## 9. Sign the release build (required by Play Store)

Generate a keystore once, keep it forever (losing it means you can never update the app again):

```bash
keytool -genkey -v -keystore civicfix-release.keystore -alias civicfix -keyalg RSA -keysize 2048 -validity 10000
```

In `android/app/build.gradle`, add a `signingConfigs` block pointing at that keystore and reference it from `buildTypes.release` (Android Studio's **Build → Generate Signed Bundle/APK** wizard will do this for you interactively — easiest for a first release).

Then build the **Android App Bundle** (Play Store requires `.aab`, not `.apk`):

```bash
npm run android:bundle
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## 10. Play Store Console checklist

- **Data safety form**: declare that you collect location, photos, phone number, and financial account details (for payouts) — link the in-app Privacy Policy (already built into Profile → Legal & Policies).
- **Target API level**: Capacitor 6 defaults to a current `targetSdkVersion` — confirm it meets Play's current minimum before submitting.
- **Permissions declaration**: Play Console will ask why you need `CAMERA` and `ACCESS_FINE_LOCATION` — the app's report-submission flow is the justification.
- **Content rating questionnaire**: civic-utility, no user-generated public content feed (reports go to admin review, not a public wall) — rate accordingly.
- **App category**: Maps & Navigation or Communication both fit; House & Home/Government-adjacent categories require extra care given the Non-Government Disclaimer.
- Keep the **Non-Government Disclaimer** (already in Profile → Legal & Policies) prominent — it's what protects you from being flagged as impersonating an official government app.

## What's still demo-grade and needs real integration before launch

- **OTP login** — currently a hardcoded `1234`. Wire to Twilio or a local SMS aggregator.
- **JazzCash / EasyPaisa / Raast payouts** — currently an admin-reviewed manual queue (a legitimate MVP pattern), not a live merchant API call. Integrating real disbursement APIs is a separate, bank-compliance-heavy project.
- **Reverse geocoding** — calls the public Nominatim API at runtime; fine for low volume, but Nominatim's usage policy caps request rates. For production scale, switch to Google Geocoding API or a paid Pakistan-coverage provider.
