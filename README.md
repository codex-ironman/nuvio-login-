# Nuvio Account Manager

Independent browser companion for managing several Nuvio accounts. No framework, dependencies or database required. Nuvio is a separate project; this app is not an official Nuvio dashboard.

## Run

Requires Node.js 20 or later.

```sh
npm start
```

Open http://localhost:3000. `npm test` checks the API adapter and copy behaviour. `npm run check` checks JavaScript syntax. The static files (`index.html`, `style.css`, `app.js`, `api.js`) can also be hosted on any HTTPS static host.

## Features

- Connect multiple accounts and select a master.
- Link-code login; email/password login for self-hosted servers that support it.
- Discover server configuration through `/.well-known/nuvio`, or supply a public client key manually.
- Per-profile addon add/remove, URL change, display-name rename, enable/disable and order.
- Create/rename profiles, set avatar colour, manage primary-addon inheritance.
- Set/change/remove four-digit profile PINs using Nuvio RPCs and current-PIN verification.
- View/edit synced TV settings JSON.
- Preview master-to-destination copying. Merge keeps destination-only addons; replace removes them. Settings merge by feature, replacing matching source features.
- Clearly separated demo accounts. Demo data only lives in memory.

## Connecting real accounts

Enter your backend URL (official default: `https://api.nuvio.tv`). The app tries Nuvio discovery. If it is unavailable, enter your backend's **publishable / anon client key** in Advanced connection. The official public client key is not included in this repository; obtain it from your Nuvio client configuration. Do not enter a secret or service-role key. Key and backend must belong to the same deployment.

For official accounts, use link-code sign-in on Nuvio's own login page. Direct email login is for compatible self-hosted servers. Each account must be signed in separately. The server must permit browser requests from the app's origin (CORS) and expose the RPCs used by the current Nuvio TV client. Unsupported endpoints produce visible errors; legacy table fallbacks are intentionally not attempted.

## Data and limitations

Passwords are not stored. Access/refresh tokens are retained in JavaScript memory for the current tab only and sent directly to the selected backend. Closing/reloading the tab disconnects the app. PINs are sent only when requested; live PINs are not retained by this app. Demo PINs are temporary sample state. Disconnect requests backend logout and clears the local session even if logout fails.

Copying does not copy account credentials, profile names, PINs or device-only preferences. Accounts and profiles are not cloned wholesale. Addon and settings saves are separate operations: a partial copy can occur, and each result is reported. If a save times out, refresh before retrying. Copy operations never claim atomic rollback.

Settings use `sync_pull_profile_settings_blob` / `sync_push_profile_settings_blob` with `p_platform: tv`; mobile-specific or device-only settings are not guaranteed to share this schema. Advanced settings can include provider-related configuration, so review source settings before copying.

Live Nuvio integration has not been verified against a real account. Tests verify local adapter behaviour with mocked server responses, not authorization or compatibility of an actual Nuvio deployment. No account secrets are committed.

## Hosting

A GitHub Pages workflow is provided. In repository **Settings → Pages**, select **GitHub Actions** as the source, then run **Deploy web app** in Actions. The workflow tests and publishes only the four static app files. A live URL exists only after deployment succeeds. You can use another HTTPS static host without changing the app.
