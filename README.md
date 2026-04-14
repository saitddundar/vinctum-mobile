# Vinctum Mobile

React Native + Expo mobile client for the [Vinctum Core](https://github.com/saitddundar/vinctum-core) decentralized data courier platform.

## Architecture

Feature-based structure mirroring vinctum-core's microservice layout:

```
app/                           # Expo Router file-based routing
├── _layout.tsx                #   root layout, auth guard, QueryProvider
├── (auth)/                    #   login, register screens
└── (tabs)/                    #   5-tab main interface
    ├── index.tsx              #     home
    ├── devices.tsx            #     device management
    ├── transfers.tsx          #     file send/receive
    ├── pairing.tsx            #     device pairing (code generate/redeem)
    └── sessions.tsx           #     peer sessions

src/
├── api/client.ts              # axios instance + JWT interceptor + auto-refresh
├── store/auth.ts              # zustand auth store + SecureStore persistence
├── lib/
│   ├── theme.ts               #   dark glassmorphism color/spacing/radius tokens
│   ├── crypto.ts              #   X25519, ECDH, HKDF, AES-256-GCM (matches core)
│   ├── chunker.ts             #   file chunking + encryption
│   ├── device.ts              #   device fingerprint + registration helpers
│   └── keyManager.ts          #   X25519 key pair lifecycle + upload
├── components/
│   └── DockTabBar.tsx         #   custom floating glass dock tab bar
└── features/
    ├── devices/               #   types, useDevices, usePairing, useDeviceKeys
    ├── transfer/              #   types, useTransfers, useUpload, useDownload
    └── sessions/              #   types, useSessions
```

## Tech Stack

| Layer       | Technology                                    |
|-------------|-----------------------------------------------|
| Framework   | React Native 0.81 + Expo 54                   |
| Language    | TypeScript 5.9                                |
| Navigation  | Expo Router (file-based)                       |
| State       | Zustand (auth) + TanStack Query (server cache) |
| HTTP        | Axios (JWT interceptor + auto-refresh)         |
| Storage     | expo-secure-store (tokens, keys)               |
| Crypto      | react-native-quick-crypto (X25519, AES-256-GCM)|
| UI          | Dark glassmorphism theme, expo-blur, Reanimated |
| Icons       | Ionicons (@expo/vector-icons)                  |

## Backend Connection

Connects to vinctum-core's Gateway service via REST API at `:8080`.

| Feature     | Endpoints                                         |
|-------------|---------------------------------------------------|
| Auth        | `/api/v1/auth/*` (register, login, refresh, verify)|
| Devices     | `/api/v1/devices/*` (CRUD, pairing, heartbeat)     |
| Device Keys | `/api/v1/devices/{id}/key` (X25519 upload/fetch)   |
| Sessions    | `/api/v1/sessions/*` (create, join, leave, close)  |
| Transfers   | `/api/v1/transfers/*`, `/api/v1/chunks/*`          |
| Events      | `/api/v1/transfer-events` (NDJSON stream)          |

## E2E Encryption

Matches vinctum-core's protocol (`pkg/crypto/ecdh.go`):

1. Each device generates a static X25519 key pair, uploads public key to Identity
2. Sender creates ephemeral X25519 key pair per transfer
3. ECDH: ephemeral private + receiver static public → shared secret
4. HKDF-SHA256: salt = `ephemeralPub || receiverStaticPub`, info = `vinctum-transfer-v1:<transferId>` → 32-byte AES key
5. Each chunk encrypted with AES-256-GCM (nonce || ciphertext || tag)
6. Server only stores ciphertext, never sees plaintext

## Getting Started

```bash
npm install --legacy-peer-deps
npm start          # expo dev server
npm run android    # android emulator
npm run ios        # iOS simulator (macOS only)
```

## License

MIT
