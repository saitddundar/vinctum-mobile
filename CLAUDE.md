# Vinctum Mobile

React Native + Expo (TypeScript) mobile client for vinctum-core.

## Project Structure

Feature-based architecture under `src/`:
- `src/features/{auth,devices,transfer,sessions}/` — each feature has screens/, components/, hooks/, types.ts
- `src/api/` — axios instance + TanStack Query hooks
- `src/store/` — zustand stores (auth, user)
- `src/lib/` — crypto utilities, secure storage helpers
- `src/components/` — shared UI components
- `src/navigation/` — expo-router layouts

## Key Conventions

- **Commit messages**: short, single-line with `-m` flag. Conventional commit style: `feat(auth):`, `fix(transfer):`, etc.
- **State**: zustand for global state, TanStack Query for server state (API cache).
- **API calls**: all go through `src/api/client.ts` axios instance. Never call fetch/axios directly from components.
- **Auth tokens**: stored in expo-secure-store, attached via axios interceptor.
- **Navigation**: expo-router file-based routing under `app/` directory.
- **Crypto**: X25519 key exchange + AES-256-GCM encryption — matches vinctum-core's E2E protocol.

## Backend

Vinctum-core Gateway at `http://localhost:8080` (configurable).
- REST API: `/api/v1/*`
- NDJSON streams: `/api/v1/transfers/watch`
- Auth: JWT bearer tokens (access + refresh)

## Build & Run

```bash
npm install
npm start           # expo dev server
npm run android     # android emulator
npm run ios         # iOS simulator (macOS only)
```

## Testing

```bash
npm test
```
