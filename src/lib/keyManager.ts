import * as SecureStore from "./storage";
import { api } from "../api/client";
import { getStoredDeviceId } from "./device";
import Constants from "expo-constants";

const isExpoGo = Constants.executionEnvironment === "storeClient";

const PRIVATE_KEY = "x25519_private_key";
const PUBLIC_KEY = "x25519_public_key";

export async function getOrCreateDeviceKeyPair(): Promise<{ privateKey: Buffer; publicKey: Buffer }> {
  if (isExpoGo) throw new Error("Crypto not available in Expo Go");

  const existing = await SecureStore.getItemAsync(PRIVATE_KEY);
  if (existing) {
    const pub = await SecureStore.getItemAsync(PUBLIC_KEY);
    return {
      privateKey: Buffer.from(existing, "base64"),
      publicKey: Buffer.from(pub!, "base64"),
    };
  }

  const { generateX25519KeyPair } = require("./crypto");
  const { privateKey, publicKey } = generateX25519KeyPair();
  await SecureStore.setItemAsync(PRIVATE_KEY, privateKey.toString("base64"));
  await SecureStore.setItemAsync(PUBLIC_KEY, publicKey.toString("base64"));
  return { privateKey, publicKey };
}

export async function ensureKeyUploaded(): Promise<void> {
  if (isExpoGo) return;

  const deviceId = await getStoredDeviceId();
  if (!deviceId) return;

  const { publicKey } = await getOrCreateDeviceKeyPair();

  try {
    await api.get(`/api/v1/devices/${deviceId}/key`);
  } catch (e: any) {
    if (e?.response?.status === 404) {
      await api.post(`/api/v1/devices/${deviceId}/key`, {
        kex_algo: "x25519",
        kex_public_key: publicKey.toString("base64"),
      });
    }
  }
}
