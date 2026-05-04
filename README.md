# Vinctum Mobile

React Native + Expo mobile client for the [Vinctum Core](https://github.com/saitddundar/vinctum-core) decentralized data courier platform.

## Screenshots

> Dark glassmorphism UI with floating dock navigation

## Features

- **Dashboard** -- device stats, active transfers, quick actions
- **File Transfers** -- E2E encrypted send/receive with chunk-based progress, incoming transfer approval
- **Friends** -- user search, friend requests, friend list management
- **Network** -- node health metrics, ML-powered anomaly detection & security scan
- **Profile** -- account info, password change, sign out
- **Devices** -- register, revoke, view approved/pending devices
- **Pairing** -- 6-char pairing code generate/redeem workflow
- **Sessions** -- create, join, leave, close peer sessions
- **Auth** -- login, register, forgot password, JWT auto-refresh

## Architecture

```
app/                              # Expo Router file-based routing
├── _layout.tsx                   #   root layout, auth guard, QueryProvider
├── (auth)/                       #   auth screens
│   ├── login.tsx                 #     sign in
│   ├── register.tsx              #     sign up
│   └── forgot-password.tsx       #     password reset request
├── (tabs)/                       #   main tab interface
│   ├── _layout.tsx               #     tab navigator + DockTabBar
│   ├── index.tsx                 #     home / dashboard
│   ├── transfers.tsx             #     file send/receive + incoming approval
│   ├── friends.tsx               #     friend list, requests, search
│   ├── network.tsx               #     node metrics + ML anomaly scan
│   ├── profile.tsx               #     account settings + change password
│   ├── devices.tsx               #     device management (hidden tab)
│   ├── pairing.tsx               #     device pairing (hidden tab)
│   └── sessions.tsx              #     peer sessions (hidden tab)
└── transfers/
    └── [id].tsx                  #   transfer detail view

src/
├── api/client.ts                 # axios instance + JWT interceptor + auto-refresh
├── store/auth.ts                 # zustand auth store + SecureStore persistence
├── lib/
│   ├── theme.ts                  #   dark glassmorphism tokens (colors, spacing, radius)
│   ├── crypto.ts                 #   X25519, ECDH, HKDF-SHA256, AES-256-GCM
│   ├── chunker.ts                #   file chunking + per-chunk encryption
│   ├── device.ts                 #   device fingerprint + registration
│   ├── keyManager.ts             #   X25519 key pair lifecycle
│   ├── validation.ts             #   input validation (pubkey, node ID, file size)
│   ├── storage.ts                #   SecureStore wrapper
│   └── toast.ts                  #   zustand-based toast notifications
├── components/
│   ├── DockTabBar.tsx            #   floating glass dock with blur + pill indicators
│   ├── DevicePicker.tsx          #   device selector modal for transfers
│   ├── IncomingTransferBanner.tsx #   SSE-driven incoming transfer notifications
│   └── Toast.tsx                 #   animated toast component
└── features/
    ├── devices/                  #   types, useDevices, usePairing, useDeviceKeys
    ├── transfer/                 #   types, useTransfers, useUpload, useDownload, useTransferEvents
    ├── sessions/                 #   types, useSessions
    ├── friends/                  #   types, useFriends, useSearchUsers, useRespondToFriendRequest
    └── network/                  #   types, useNodeMetrics, useMLHealth, useScanNodes
```

## Tech Stack

| Layer       | Technology                                     |
|-------------|-------------------------------------------------|
| Framework   | React Native 0.81 + Expo 54                     |
| Language    | TypeScript 5.9                                   |
| Navigation  | Expo Router (file-based routing)                 |
| State       | Zustand (auth) + TanStack Query (server cache)   |
| HTTP        | Axios (JWT interceptor + auto-refresh)           |
| Storage     | expo-secure-store (tokens, keys)                 |
| Crypto      | react-native-quick-crypto (X25519, AES-256-GCM)  |
| UI          | Dark glassmorphism, expo-blur, Ionicons          |

## Navigation

The app uses a custom floating dock tab bar with 5 main tabs:

| Tab        | Icon    | Screen           |
|------------|---------|------------------|
| Home       | home    | Dashboard + stats |
| Transfers  | swap    | Send/Receive      |
| Friends    | people  | Social            |
| Network    | pulse   | Health + ML       |
| Profile    | person  | Account           |

Devices, Pairing, and Sessions are accessible via quick actions on the Home screen.

## Backend Connection

Connects to vinctum-core's Gateway service via REST API at `:8080`.

| Feature     | Endpoints                                          |
|-------------|-----------------------------------------------------|
| Auth        | `/api/v1/auth/*` (login, register, refresh, verify, forgot/reset password) |
| Devices     | `/api/v1/devices/*` (CRUD, pairing, heartbeat)      |
| Device Keys | `/api/v1/devices/{id}/key` (X25519 upload/fetch)    |
| Sessions    | `/api/v1/sessions/*` (create, join, leave, close)    |
| Transfers   | `/api/v1/transfers/*`, `/api/v1/chunks/*`            |
| Friends     | `/api/v1/friends/*`, `/api/v1/users/search`          |
| Network     | `/api/v1/nodes/metrics`, `/api/v1/nodes/scan`, `/api/v1/ml/health` |
| Events      | `/api/v1/transfer-events` (NDJSON stream)            |

## E2E Encryption

Matches vinctum-core's protocol (`pkg/crypto/ecdh.go`):

1. Each device generates a static X25519 key pair, uploads public key to Identity service
2. Sender creates ephemeral X25519 key pair per transfer
3. ECDH: ephemeral private + receiver static public -> shared secret
4. HKDF-SHA256: salt = `ephemeralPub || receiverStaticPub`, info = `vinctum-transfer-v1:<transferId>` -> 32-byte AES key
5. Each chunk encrypted with AES-256-GCM (nonce || ciphertext || tag)
6. Server only stores ciphertext -- never sees plaintext or keys

## Getting Started

**Prerequisites:** Node.js 18+, Android Studio or Xcode

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start Expo dev server
npm start

# Run on platform
npm run android    # Android emulator/device
npm run ios        # iOS simulator (macOS only)
```

Make sure vinctum-core's Gateway is running on port 8080. The app auto-detects the host via Expo's debugger host for physical devices, falls back to `10.0.2.2:8080` (Android emulator) or `localhost:8080` (iOS simulator).

## License

MIT
