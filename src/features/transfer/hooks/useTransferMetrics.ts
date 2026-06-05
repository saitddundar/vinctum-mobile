import { useQuery } from "@tanstack/react-query";
import { api } from "../../../api/client";

export type ActivityDay = {
  date: string;
  transfer_count: number;
};

export type TransferSpeed = {
  bytes_per_sec: number;
  active_transfers: number;
};

export function useActivityHeatmap(nodeId: string | null) {
  return useQuery({
    queryKey: ["transfer-activity", nodeId],
    queryFn: async () => {
      const { data } = await api.get<{ days: ActivityDay[] }>(
        `/api/v1/node-transfers/${nodeId}/activity`
      );
      return data.days || [];
    },
    enabled: !!nodeId,
    refetchInterval: 30000,
  });
}

export function useTransferSpeed(nodeId: string | null) {
  return useQuery({
    queryKey: ["transfer-speed", nodeId],
    queryFn: async () => {
      const { data } = await api.get<TransferSpeed>(
        `/api/v1/node-transfers/${nodeId}/speed`
      );
      return data;
    },
    enabled: !!nodeId,
    refetchInterval: 10000,
  });
}
