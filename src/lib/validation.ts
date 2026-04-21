const BASE64_RE = /^[A-Za-z0-9+/]+=*$/;
const HEX_RE = /^[a-f0-9]+$/;

// X25519 public key: 32 bytes → 44 chars base64
const X25519_B64_LEN = 44;

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

export function validatePubKey(key: string): string | null {
  if (!key) return "Public key is required";
  if (!BASE64_RE.test(key)) return "Invalid base64 format";
  if (key.length !== X25519_B64_LEN) return "Invalid key length (expected X25519 — 32 bytes)";
  return null;
}

export function validateNodeId(nodeId: string): string | null {
  if (!nodeId) return "Node ID is required";
  if (!HEX_RE.test(nodeId)) return "Node ID must be hex characters";
  if (nodeId.length !== 64) return "Node ID must be 64 hex characters";
  return null;
}

export function validateFileSize(bytes: number): string | null {
  if (bytes <= 0) return "File is empty";
  if (bytes > MAX_FILE_SIZE) return `File too large (max ${MAX_FILE_SIZE / (1024 * 1024)} MB)`;
  return null;
}
