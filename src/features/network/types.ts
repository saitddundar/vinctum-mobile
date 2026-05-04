export interface NodeMetricsData {
  node_id: string;
  total_events: number;
  successes: number;
  failures: number;
  timeouts: number;
  reroutes: number;
  circuit_opens: number;
  avg_latency_ms: number;
  min_latency_ms: number;
  max_latency_ms: number;
  p95_latency_ms: number;
  total_bytes: number;
  avg_bytes_per_op: number;
  failure_rate: number;
  uptime: number;
}

export interface NodeScanResult {
  node_id: string;
  score: number;
  confidence: number;
  is_anomaly: boolean;
  anomaly_score: number;
  has_metrics: boolean;
}

export interface ScanSummary {
  total: number;
  anomalies: number;
  avg_score: number;
  scanned: number;
}

export interface ScanResponse {
  nodes: NodeScanResult[];
  summary: ScanSummary;
}

export interface HealthResponse {
  status: string;
  version: string;
  uptime_seconds: number;
  models_loaded: Record<string, boolean>;
}
