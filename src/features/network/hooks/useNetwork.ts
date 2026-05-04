import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../../../api/client";
import type { NodeMetricsData, ScanResponse, HealthResponse } from "../types";

export function useNodeMetrics() {
  return useQuery({
    queryKey: ["node-metrics"],
    queryFn: async () => {
      const { data } = await api.get<{ nodes: NodeMetricsData[] }>("/api/v1/nodes/metrics");
      return data.nodes || [];
    },
  });
}

export function useMLHealth() {
  return useQuery({
    queryKey: ["ml-health"],
    queryFn: async () => {
      try {
        const { data } = await api.get<HealthResponse>("/api/v1/ml/health");
        return data;
      } catch {
        return null;
      }
    },
    retry: false,
  });
}

export function useScanNodes() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ScanResponse>("/api/v1/nodes/scan");
      return data;
    },
  });
}
