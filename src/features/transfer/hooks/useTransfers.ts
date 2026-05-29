import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../api/client";
import { Transfer, TransferDetail, InitiateTransferRequest } from "../types";

const PAGE_SIZE = 30;

export function useNodeTransfers(nodeId: string) {
  return useQuery({
    queryKey: ["transfers", nodeId],
    queryFn: async () => {
      const { data } = await api.get<{ transfers: Transfer[] }>(`/api/v1/node-transfers/${nodeId}`);
      return data.transfers;
    },
    enabled: !!nodeId,
  });
}

export function useNodeTransfersPaginated(nodeId: string) {
  return useInfiniteQuery({
    queryKey: ["transfers-paged", nodeId],
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await api.get<{ transfers: Transfer[] }>(
        `/api/v1/node-transfers/${nodeId}?limit=${PAGE_SIZE}&offset=${pageParam}`
      );
      return { transfers: data.transfers ?? [], nextOffset: pageParam + PAGE_SIZE };
    },
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.transfers.length === PAGE_SIZE ? last.nextOffset : undefined,
    enabled: !!nodeId,
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

export function usePauseTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transferId: string) => {
      const { data } = await api.post<{ transfer_id: string; status: string }>(
        `/api/v1/transfers/${transferId}/pause`
      );
      return data;
    },
    onSuccess: (_, transferId) => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      qc.invalidateQueries({ queryKey: ["transfer", transferId] });
    },
  });
}

export function useResumeTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transferId: string) => {
      const { data } = await api.post<{ transfer_id: string; status: string }>(
        `/api/v1/transfers/${transferId}/resume`
      );
      return data;
    },
    onSuccess: (_, transferId) => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      qc.invalidateQueries({ queryKey: ["transfer", transferId] });
    },
  });
}
