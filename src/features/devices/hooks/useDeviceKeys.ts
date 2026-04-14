import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../api/client";

interface DeviceKey {
  device_id: string;
  kex_algo: string;
  kex_public_key: string;
  created_at: string;
  rotated_at: string | null;
}

export function useDeviceKey(deviceId: string) {
  return useQuery({
    queryKey: ["device-key", deviceId],
    queryFn: async () => {
      const { data } = await api.get<{ key: DeviceKey }>(`/api/v1/devices/${deviceId}/key`);
      return data.key;
    },
    enabled: !!deviceId,
  });
}

export function useUploadDeviceKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ deviceId, publicKey }: { deviceId: string; publicKey: string }) => {
      const { data } = await api.post<{ key: DeviceKey }>(`/api/v1/devices/${deviceId}/key`, {
        kex_algo: "x25519",
        kex_public_key: publicKey,
      });
      return data.key;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["device-key", vars.deviceId] }),
  });
}

export function useSessionKeys(sessionId: string) {
  return useQuery({
    queryKey: ["session-keys", sessionId],
    queryFn: async () => {
      const { data } = await api.get<{ keys: DeviceKey[] }>(`/api/v1/sessions/${sessionId}/keys`);
      return data.keys;
    },
    enabled: !!sessionId,
  });
}
