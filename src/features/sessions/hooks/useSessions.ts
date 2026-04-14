import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../api/client";
import { Session } from "../types";
import { Device } from "../../devices/types";

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data } = await api.get<{ sessions: Session[] }>("/api/v1/sessions");
      return data.sessions;
    },
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, deviceId }: { name: string; deviceId: string }) => {
      const { data } = await api.post<{ session: Session }>("/api/v1/sessions", {
        name,
        device_id: deviceId,
      });
      return data.session;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useCloseSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await api.post(`/api/v1/sessions/${sessionId}/close`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useJoinSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, deviceId }: { sessionId: string; deviceId: string }) => {
      await api.post(`/api/v1/sessions/${sessionId}/join`, { device_id: deviceId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useLeaveSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, deviceId }: { sessionId: string; deviceId: string }) => {
      await api.post(`/api/v1/sessions/${sessionId}/leave`, { device_id: deviceId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useSessionDevices(sessionId: string) {
  return useQuery({
    queryKey: ["session-devices", sessionId],
    queryFn: async () => {
      const { data } = await api.get<{ devices: Device[] }>(`/api/v1/sessions/${sessionId}/devices`);
      return data.devices;
    },
    enabled: !!sessionId,
  });
}
