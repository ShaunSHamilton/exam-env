# Exam Environment

## MRUGESH

### Getting Started

1. Clone fork, fetch branches, use `feat_auth0` branch

```bash
git clone https://github.com/ShaunSHamilton/exam-env.git
git fetch origin feat_auth0
git checkout feat_auth0
```

2. Install prerequisites: https://v2.tauri.app/start/prerequisites/

```bash
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

```bash
[[ "$(node --version)" == "v22."* ]] && echo "All good." || echo "Nodejs version must be 22"
```

```bash
cargo install tauri-cli
```

```bash
curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=10.5.2 sh -
```

3. Install dependencies

```bash
pnpm i
```

4. Copy `sample.env` to `.env` and fill in the values

```bash
cp .env.sample .env
```

5. Add needed keys (message)
6. Run the development build

```bash
cargo tauri dev --config src-tauri/tauri.dev.conf.json
```

### Extra Information

Everything needs to be done through the backend (Rust). Tauri provides plugins and hooks which make this possible through IPC on the JS side.

What this means, is things like the global `fetch` cannot be used. Instead, `@tauri-apps/plugin-http` provides a `fetch` function that is almost identical.

When the Auth0 login works, you can only tell by what is in the app console (F12). The logic is not implemented to actually use the `auth_token` yet. So, all redirects go to the `/login` page.

All relevant code is in `src/pages/login.tsx` and `src/main.tsx`.

Global search for `MRUGESH` to find comments around relevant code.

## Development

https://v2.tauri.app/start/prerequisites/

This repo uses `pnpm`.

### Development Server

```bash
cargo tauri dev
```

### Adding Plugins

```bash
cargo tauri add <plugin-name>
```

### Miscellaneous

Generating TypeScript types from Rust types to keep them in sync:

```bash
cargo test
```

---

More info you will probably find very useful:

```bash
cargo tauri --help
```

### Errors

The main types of error:

1. Unrecoverable
2. Blocking
3. Non-blocking

During an exam, errors are treated with the utmost care. On other pages/events, errors are less high-profile.

Unrecoverable errors emit events to Sentry, and either an error page is shown to the Camper, or the app crashes (sometimes this is unavoidable).

Blocking errors prevent further access to the app until the error is resolved.

Non-blocking errors display an inline message about the failure to the Camper. It is up to the user to retry the action.

#### During an Exam

##### Unrecoverable Errors

**Example: API returns 500 for generated exam request**

After retrying request 3 times, the error page is shown. An event is emitted to Sentry.

##### Blocking Errors

The exam attempt is continued, but no more question submissions may be made until the error is resolved.

**Example: Connection to API is offline**

A modal appears telling Camper to reconnect and rety request. Once the request is able to go through, the modal disappears.

Likely causes:

- Device loses internet connection

**Example: Camera is inaccessible**

A modal appears requesting access be reinstated.

Likely causes:

- App permissions to media device revoked
  - Manually done by Camper
  - Manually done by 3rd party
    - 3rd party takes priority access to camera. E.g. Google Meet
- Device is disconnected from computer
  - Manually done by Camper
  - Malfunction

**Example: OS secret storage loses access to authorization token**

After retrying to get the key from the OS keystore, a modal appears requesting the token be set again.

Likely causes:

- App permissions to keystore revoked
  - Manually done by Camper
  - Manually done by 3rd party
- Deletion of token from keystore
  - Manually done by Camper
  - Manually done by 3rd party
    - Would require Camper to give the 3rd party permission to access this keystore

##### Non-Blocking Errors

**Example: API is unable to process screenshots**

The app continues sending requests, and the Camper is oblivious to issue. This is entirely handled/logged by the API.

#### Elsewhere

##### Unrecoverable Errors

##### Blocking Errors

##### Non-Blocking Errors

## Build

### Updater (DISABLED)

Requires updater signing keys for the update artifacts:

```bash
export TAURI_SIGNING_PRIVATE_KEY="Path or content of your private key"
# optionally also add a password
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""
```

Creating the key is a **ONE TIME** operation:

```bash
cargo tauri signer generate -w ./.tauri/exam-env.key
```

### Workflow

A manual run of the `publish` action can build and cut the release of the app. The `version` field in the `package.json` and `src-tauri/tauri.conf.json` files should be updated.

### Local

```bash
cargo tauri build --config src-tauri/tauri.dev.conf.json
# OR, build a debug build
cargo tauri build --debug
```

The `tauri.conf.dev.json` config does not sign the bundle, and does not create updater artifacts. Also, it disables the `contentProtected` feature so the app can be screenshotted.

### Windows

```bash
.\scripts\WindowsEnv.ps1 -Command "cargo tauri build --config src-tauri/tauri.microsoftstore.conf.json --bundles msi,updater --target x86_64-pc-windows-msvc"
```
