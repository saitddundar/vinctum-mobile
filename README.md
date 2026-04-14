# Vinctum Mobile

React Native + Expo mobile client for the [Vinctum Core](https://github.com/saitddundar/vinctum-core) decentralized data courier platform.

## Architecture

Feature-based structure mirroring vinctum-core's microservice layout:

```
src/
├── features/
│   ├── auth/          # login, register, JWT token management
│   ├── devices/       # device management, pairing (6-char codes)
│   ├── transfer/      # chunk-based E2E encrypted file transfer
│   └── sessions/      # peer session management
├── api/               # axios client, TanStack Query hooks
├── store/             # zustand global state
├── lib/               # crypto (X25519, AES-256-GCM), secure storage
├── components/        # shared UI components
└── navigation/        # expo-router layouts
```

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Framework   | React Native 0.81 + Expo 54        |
| Language    | TypeScript 5.9                      |
| Navigation  | Expo Router (file-based)            |
| State       | Zustand                             |
| API/Cache   | TanStack Query + Axios              |
| Storage     | expo-secure-store (JWT tokens)      |
| Crypto      | react-native-quick-crypto           |

## Backend Connection

Connects to vinctum-core's Gateway service via REST API at `:8080`.

Key API groups:
- **Auth** — `/api/v1/auth/*` (register, login, refresh, verify)
- **Devices** — `/api/v1/devices/*` (CRUD, pairing, heartbeat)
- **Sessions** — `/api/v1/sessions/*` (create, join, leave)
- **Transfers** — `/api/v1/transfers/*` (initiate, upload/download chunks, watch stream)
- **Device Keys** — `/api/v1/devices/{id}/key` (X25519 public key upload/fetch)

## Getting Started

```bash
npm install
npm start          # expo start
npm run android    # expo start --android
npm run ios        # expo start --ios
```

## License

MIT
