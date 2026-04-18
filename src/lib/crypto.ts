// Lazy-load so the module doesn't crash in Expo Go where NitroModules are absent.
let _qc: any;
function QC() {
  if (!_qc) {
    try {
      _qc = require("react-native-quick-crypto").default ?? require("react-native-quick-crypto");
    } catch {
      throw new Error("react-native-quick-crypto is not available — use a development build (expo prebuild).");
    }
  }
  return _qc;
}

// Matches vinctum-core pkg/crypto/ecdh.go exactly:
// salt = ephemeralPub || receiverStaticPub
// info = "vinctum-transfer-v1:<transferId>"

export function generateX25519KeyPair(): { privateKey: Buffer; publicKey: Buffer } {
  const keyPair = QC().generateKeyPairSync("x25519") as any;
  const privDer = keyPair.privateKey.export({ type: "pkcs8", format: "der" });
  const pubDer = keyPair.publicKey.export({ type: "spki", format: "der" });
  return {
    privateKey: Buffer.from(privDer.slice(-32)),
    publicKey: Buffer.from(pubDer.slice(-32)),
  };
}

export function ecdh(localPrivateKey: Buffer, remotePubKey: Buffer): Buffer {
  const priv = QC().createPrivateKey({
    key: buildX25519Pkcs8(localPrivateKey),
    format: "der",
    type: "pkcs8",
  });
  const pub = QC().createPublicKey({
    key: buildX25519Spki(remotePubKey),
    format: "der",
    type: "spki",
  });
  const secret = QC().diffieHellman({ privateKey: priv as any, publicKey: pub as any });
  return Buffer.from(secret as any);
}

export function deriveTransferKey(
  sharedSecret: Buffer,
  transferId: string,
  ephemeralPub: Buffer,
  receiverStaticPub: Buffer
): Buffer {
  const salt = Buffer.concat([ephemeralPub, receiverStaticPub]);
  const info = Buffer.from(`vinctum-transfer-v1:${transferId}`);
  const derived = QC().hkdfSync("sha256", sharedSecret, salt, info, 32);
  return Buffer.from(derived as any);
}

export function encryptAESGCM(key: Buffer, plaintext: Buffer): Buffer {
  const nonce = Buffer.from(QC().randomBytes(12));
  const cipher = (QC() as any).createCipheriv("aes-256-gcm", key, nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  // nonce(12) || ciphertext || tag(16) — matches Go's gcm.Seal
  return Buffer.concat([nonce, encrypted, tag]);
}

export function decryptAESGCM(key: Buffer, data: Buffer): Buffer {
  if (data.length < 28) throw new Error("ciphertext too short");
  const nonce = data.subarray(0, 12);
  const tag = data.subarray(data.length - 16);
  const ciphertext = data.subarray(12, data.length - 16);
  const decipher = (QC() as any).createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function sha256(data: Buffer): string {
  const hash = (QC() as any).createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
}

function buildX25519Pkcs8(raw32: Buffer): Buffer {
  const prefix = Buffer.from("302e020100300506032b656e04220420", "hex");
  return Buffer.concat([prefix, raw32]);
}

function buildX25519Spki(raw32: Buffer): Buffer {
  const prefix = Buffer.from("302a300506032b656e032100", "hex");
  return Buffer.concat([prefix, raw32]);
}
