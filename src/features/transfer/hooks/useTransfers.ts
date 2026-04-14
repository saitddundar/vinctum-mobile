import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../api/client";
import { Transfer, TransferDetail, InitiateTransferRequest } from "../types";

export function useNodeTransfers(nodeId: string) {
  return useQuery({
    queryKey: ["transfers", nodeId],
    queryFn: async () => {
      const { data } = await api.get<{ transfers: Transfer[] }>(`/api/v1/node-transfers/${nodeId}`);
      return data.transfers;
    },
    enabled: !!nodeId,
    refetchInterval: 5000,
  });
}

export function useTransferDetail(transferId: string) {
  return useQuery({
    queryKey: ["transfer", transferId],
    queryFn: async () => {
      const { data } = await api.get<TransferDetail>(`/api/v1/transfers/${transferId}`);
      return data;
    },
    enabled: !!transferId,
    refetchInterval: 3000,
  });
}

export function useInitiateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: InitiateTransferRequest) => {
      const { data } = await api.post("/api/v1/transfers", req);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transfers"] }),
  });
}

export function useCancelTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ transferId, reason }: { transferId: string; reason: string }) => {
      await api.post(`/api/v1/transfers/${transferId}/cancel`, { reason });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transfers"] }),
  });
}
