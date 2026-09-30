# Nuvio Manager Android

Android 8.0+ APK wrapper for https://codex-ironman.github.io/nuvio-login-/ . Internet is required. This is an independent Nuvio companion, not the official Nuvio player. Web dashboard updates appear in the APK without reinstalling. Native shell changes require a new APK.

Package ID: `com.codexironman.nuviomanager`.
First release: versionName `1.0.0`, versionCode `1`.

The WebView runs only the app's HTTPS origin/path. External HTTPS links open in the phone's browser. Local file/content access, cleartext HTTP, mixed content, third-party cookies and native JavaScript bridges are disabled. The app requests only internet permission. Sessions live in the page's JavaScript memory and are lost when the WebView is destroyed or the page is reloaded.

## Build the next installable update

Keep the **same package ID and original signing keystore/alias**, and increase versionCode. Do not generate a replacement signing key for an existing installation. A different key produces an incompatible APK.

Install JDK 21, Android SDK platform 35/build tools, and Gradle 8.13. Configure `ANDROID_HOME` and create ignored `local.properties` with `sdk.dir=...` when needed. Supply these environment variables privately:

- `NUVIO_KEYSTORE_PATH`: original JKS location
- `NUVIO_STORE_PASSWORD`: original keystore password
- `NUVIO_KEY_PASSWORD`: original key password
- `NUVIO_KEY_ALIAS`: `nuvio-manager`
- `NUVIO_VERSION_CODE`: next integer, e.g. `2`
- `NUVIO_VERSION_NAME`: e.g. `1.0.1`

From `android/`, run `gradle :app:assembleRelease`. The APK is at `app/build/outputs/apk/release/app-release.apk`. Without signing variables the output is unsigned and cannot be used as a signed update.

## GitHub Actions updates

The `Build signed Android update` workflow uses the original key in repository Actions secrets. An automatic attempt to configure those secrets was rejected by GitHub permissions; they are NOT installed yet. The owner must configure:

`NUVIO_KEYSTORE_BASE64` (base64 of the original `.jks`), `NUVIO_STORE_PASSWORD`, `NUVIO_KEY_PASSWORD`, `NUVIO_KEY_ALIAS`.

Run the workflow with a larger version code and unique version name. It publishes a signed APK release. Retain the private signing backup independently of this workspace; losing it prevents compatible future updates. Never commit signing files/passwords to this public repository.

## Verification

Use `apksigner verify --verbose --print-certs <apk>` to inspect the APK and its signing certificate. Verify future updates have the same signer fingerprint. Install on an Android device and test password login, external links, account/PIN operations and updating over the prior APK. These device/live-account tests have not been performed here.
