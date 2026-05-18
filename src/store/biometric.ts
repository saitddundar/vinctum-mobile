import { create } from "zustand";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "../lib/storage";

const BIOMETRIC_KEY = "biometric_enabled";

interface BiometricState {
  isEnabled: boolean;
  isLocked: boolean;
  isSupported: boolean;
  load: () => Promise<void>;
  enable: () => Promise<boolean>;
  disable: () => Promise<void>;
  lock: () => void;
  unlock: () => Promise<boolean>;
}

export const useBiometricStore = create<BiometricState>((set, get) => ({
  isEnabled: false,
  isLocked: false,
  isSupported: false,

  load: async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const isSupported = compatible && enrolled;
    const stored = await SecureStore.getItemAsync(BIOMETRIC_KEY);
    const isEnabled = isSupported && stored === "true";
    set({ isSupported, isEnabled, isLocked: isEnabled });
  },

  enable: async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to enable Face ID",
      fallbackLabel: "Use passcode",
    });
    if (result.success) {
      await SecureStore.setItemAsync(BIOMETRIC_KEY, "true");
      set({ isEnabled: true });
      return true;
    }
    return false;
  },

  disable: async () => {
    await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
    set({ isEnabled: false, isLocked: false });
  },

  lock: () => {
    if (get().isEnabled) set({ isLocked: true });
  },

  unlock: async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Vinctum",
      fallbackLabel: "Use passcode",
    });
    if (result.success) {
      set({ isLocked: false });
      return true;
    }
    return false;
  },
}));
