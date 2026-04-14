import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../api/client";
import { Device, RegisterDeviceRequest } from "../types";

export function useDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const { data } = await api.get<{ devices: Device[] }>("/api/v1/devices");
      return data.devices;
    },
  });
}

export function useDevice(deviceId: string) {
  return useQuery({
    queryKey: ["devices", deviceId],
    queryFn: async () => {
      const { data } = await api.get<{ device: Device }>(`/api/v1/devices/${deviceId}`);
      return data.device;
    },
    enabled: !!deviceId,
  });
}

export function useRegisterDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: RegisterDeviceRequest) => {
      const { data } = await api.post<{ device: Device }>("/api/v1/devices", req);
      return data.device;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices"] }),
  });
}

export function useRevokeDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (deviceId: string) => {
      await api.delete(`/api/v1/devices/${deviceId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices"] }),
  });
}
