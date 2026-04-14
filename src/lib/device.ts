import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { DeviceType } from "../features/devices/types";

export function getDeviceType(): DeviceType {
  // expo-constants doesn't reliably detect tablet, default to PHONE on mobile
  return Platform.OS === "web" ? DeviceType.PC : DeviceType.PHONE;
}

export function getDeviceName(): string {
  return Constants.deviceName ?? `${Platform.OS}-device`;
}

export async function getOrCreateFingerprint(): Promise<string> {
  let fp = await SecureStore.getItemAsync("device_fingerprint");
  if (!fp) {
    fp = generateId();
    await SecureStore.setItemAsync("device_fingerprint", fp);
  }
  return fp;
}

export async function getStoredDeviceId(): Promise<string | null> {
  return SecureStore.getItemAsync("device_id");
}

export async function storeDeviceId(id: string): Promise<void> {
  await SecureStore.setItemAsync("device_id", id);
}

function generateId(): string {
  const chars = "abcdef0123456789";
  let id = "";
  for (let i = 0; i < 64; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
