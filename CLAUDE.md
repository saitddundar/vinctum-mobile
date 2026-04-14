# Vinctum Mobile

React Native + Expo (TypeScript) mobile client for vinctum-core.

## Project Structure

Feature-based architecture:
- `app/` — Expo Router file-based routing. `(auth)/` for login/register, `(tabs)/` for main 5-tab interface
- `src/api/client.ts` — single axios instance, JWT auto-attach via request interceptor, 401 → auto-refresh via response interceptor
- `src/store/auth.ts` — zustand store: login/logout/loadTokens, persists to SecureStore, auto-registers device + uploads X25519 key on login
- `src/lib/theme.ts` — dark glassmorphism design tokens (colors, spacing, radius)
- `src/lib/crypto.ts` — X25519 key gen, ECDH, HKDF-SHA256, AES-256-GCM encrypt/decrypt, SHA-256. Matches vinctum-core `pkg/crypto/ecdh.go` exactly
- `src/lib/chunker.ts` — file → Buffer, split into chunks, encrypt each chunk
- `src/lib/device.ts` — device fingerprint, type detection, SecureStore device ID
- `src/lib/keyManager.ts` — X25519 key pair lifecycle, ensures key uploaded to server
- `src/components/DockTabBar.tsx` — custom floating glass tab bar with blur, spring animations, Ionicons
- `src/features/devices/` — types, useDevices, usePairing, useDeviceKeys hooks
- `src/features/transfer/` — types, useTransfers, useUpload (pick file → chunk → encrypt → upload), useDownload (fetch chunks → decrypt → save)
- `src/features/sessions/` — types, useSessions hooks

## Key Conventions

- **Commits**: short single-line, `-m` flag, conventional style: `feat(auth):`, `fix(transfer):`, etc. No co-author footer.
- **Comments**: minimal. Only comment non-obvious logic, no JSDoc on every function.
- **State**: zustand for global state (auth), TanStack Query for server state (API cache).
- **API calls**: all through `src/api/client.ts` axios instance. Never call fetch/axios directly from components.
- **Auth tokens**: SecureStore, attached via axios interceptor. Auto-refresh on 401 with queue for concurrent requests.
- **Crypto**: must match vinctum-core protocol exactly — salt = `ephemeralPub || receiverStaticPub`, info = `vinctum-transfer-v1:<transferId>`.
- **UI theme**: dark glassmorphism. All colors from `src/lib/theme.ts`. Accent: `#7c5bf5`.

## Backend

Vinctum-core Gateway at `http://localhost:8080` (configurable in `src/api/client.ts`).
- REST API: `/api/v1/*`
- NDJSON streams: `/api/v1/transfer-events`, `/api/v1/chunks/{id}` (download)
- Auth: JWT bearer tokens (access + refresh), HMAC-SHA256

## Build & Run

```bash
npm install --legacy-peer-deps
npm start
npm run android
npm run ios
```
