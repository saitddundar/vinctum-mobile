import { create } from "zustand";
import * as SecureStore from "../lib/storage";
import { api } from "../api/client";
import { getDeviceName, getDeviceType, getOrCreateFingerprint, getStoredDeviceId, storeDeviceId } from "../lib/device";
import { ensureKeyUploaded } from "../lib/keyManager";

interface User {
  user_id: string;
  username: string;
  email: string;
  email_verified: boolean;
  created_at: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadTokens: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await api.post("/api/v1/auth/login", { email, password });
    await SecureStore.setItemAsync("access_token", data.access_token);
    await SecureStore.setItemAsync("refresh_token", data.refresh_token);
    set({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
      isAuthenticated: true,
    });

    // auto-register this device if not already registered
    const existingDeviceId = await getStoredDeviceId();
    if (!existingDeviceId) {
      try {
        const fingerprint = await getOrCreateFingerprint();
        const res = await api.post("/api/v1/devices", {
          name: getDeviceName(),
          device_type: getDeviceType(),
          fingerprint,
          node_id: fingerprint.slice(0, 16),
        });
        await storeDeviceId(res.data.device.device_id);
      } catch {}
    }

    ensureKeyUploaded().catch(() => {});
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
  },

  loadTokens: async () => {
    const accessToken = await SecureStore.getItemAsync("access_token");
    const refreshToken = await SecureStore.getItemAsync("refresh_token");
    if (accessToken) {
      set({ accessToken, refreshToken, isAuthenticated: true });
    }
  },
}));
