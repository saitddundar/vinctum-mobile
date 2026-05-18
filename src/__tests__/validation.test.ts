import { validatePubKey, validateNodeId, validateFileSize } from "../lib/validation";

describe("validatePubKey", () => {
  it("rejects empty key", () => {
    expect(validatePubKey("")).toBe("Public key is required");
  });

  it("rejects non-base64", () => {
    expect(validatePubKey("!!!invalid!!!")).toBe("Invalid base64 format");
  });

  it("rejects wrong length", () => {
    expect(validatePubKey("AAAA")).toBe("Invalid key length (expected X25519 — 32 bytes)");
  });

  it("accepts valid 44-char base64 key", () => {
    // 32 bytes = 44 base64 chars with padding
    const validKey = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
    expect(validKey.length).toBe(44);
    expect(validatePubKey(validKey)).toBeNull();
  });
});

describe("validateNodeId", () => {
  it("rejects empty node id", () => {
    expect(validateNodeId("")).toBe("Node ID is required");
  });

  it("rejects non-hex", () => {
    expect(validateNodeId("zzzz")).toBe("Node ID must be hex characters");
  });

  it("rejects wrong length", () => {
    expect(validateNodeId("abcdef")).toBe("Node ID must be 64 hex characters");
  });

  it("accepts valid 64-char hex", () => {
    const validId = "a".repeat(64);
    expect(validateNodeId(validId)).toBeNull();
  });
});

describe("validateFileSize", () => {
  it("rejects empty file", () => {
    expect(validateFileSize(0)).toBe("File is empty");
  });

  it("rejects negative size", () => {
    expect(validateFileSize(-1)).toBe("File is empty");
  });

  it("rejects file over 500MB", () => {
    expect(validateFileSize(501 * 1024 * 1024)).toMatch(/File too large/);
  });

  it("accepts valid file size", () => {
    expect(validateFileSize(1024)).toBeNull();
  });

  it("accepts exactly 500MB", () => {
    expect(validateFileSize(500 * 1024 * 1024)).toBeNull();
  });
});
