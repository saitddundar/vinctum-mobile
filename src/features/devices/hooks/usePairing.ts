import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../api/client";
import { PairingGenerateRequest, PairingRedeemRequest, PairingApproveRequest, Device } from "../types";

export function useGeneratePairingCode() {
  return useMutation({
    mutationFn: async (req: PairingGenerateRequest) => {
      const { data } = await api.post<{ pairing_code: string; expires_in_s: number }>(
        "/api/v1/devices/pairing/generate",
        req
      );
      return data;
    },
  });
}

export function useRedeemPairingCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: PairingRedeemRequest) => {
      const { data } = await api.post<{ device_id: string; approver_device: string }>(
        "/api/v1/devices/pairing/redeem",
        req
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices"] }),
  });
}

export function useApprovePairing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: PairingApproveRequest) => {
      const { data } = await api.post<{ success: boolean; device: Device }>(
        "/api/v1/devices/pairing/approve",
        req
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices"] }),
  });
}
