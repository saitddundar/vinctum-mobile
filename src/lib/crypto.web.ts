// Web stub — react-native-quick-crypto is a native module and cannot run in the browser.
// This file is picked up by Metro on web only (`.web.ts` resolution priority).
// All functions throw when invoked so calls are loud, but importing the module is cheap.

const NOT_SUPPORTED = "Crypto operations are not available on web — run on Android/iOS.";

export function generateX25519KeyPair(): { privateKey: Buffer; publicKey: Buffer } {
  throw new Error(NOT_SUPPORTED);
}

export function ecdh(_localPrivateKey: Buffer, _remotePubKey: Buffer): Buffer {
  throw new Error(NOT_SUPPORTED);
}

export function deriveTransferKey(
  _sharedSecret: Buffer,
  _transferId: string,
  _ephemeralPub: Buffer,
  _receiverStaticPub: Buffer
): Buffer {
  throw new Error(NOT_SUPPORTED);
}

export function encryptAESGCM(_key: Buffer, _plaintext: Buffer): Buffer {
  throw new Error(NOT_SUPPORTED);
}

export function decryptAESGCM(_key: Buffer, _data: Buffer): Buffer {
  throw new Error(NOT_SUPPORTED);
}

export function sha256(_data: Buffer): string {
  throw new Error(NOT_SUPPORTED);
}
