import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNodeMetrics, useMLHealth, useScanNodes } from "../../src/features/network/hooks/useNetwork";
import type { NodeMetricsData, NodeScanResult, ScanResponse } from "../../src/features/network/types";
import { toast } from "../../src/lib/toast";
import { colors, spacing, radius } from "../../src/lib/theme";

type Tab = "metrics" | "scan";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function truncateId(id: string): string {
  return id.length > 20 ? id.slice(0, 8) + "..." + id.slice(-6) : id;
}

export default function NetworkScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("metrics");
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);

  const { data: metrics = [], isLoading: metricsLoading, refetch: refetchMetrics } = useNodeMetrics();
  const { data: mlHealth } = useMLHealth();
  const scanMutation = useScanNodes();

  const mlOnline = mlHealth !== null && mlHealth !== undefined;

  const handleScan = () => {
    scanMutation.mutate(undefined, {
      onSuccess: (result) => {
        setScanResult(result);
        setTab("scan");
        if (result.summary.anomalies > 0) {
          toast.error(`${result.summary.anomalies} anomaly detected`);
        } else {
          toast.success("All nodes healthy");
        }
      },
      onError: () => toast.error("Scan failed"),
    });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "metrics", label: "Node Metrics" },
    { key: "scan", label: "Security Scan" },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.header}>Network</Text>
          <Text style={styles.subtitle}>Health, metrics & anomaly detection</Text>
        </View>
        <View style={styles.headerRight}>
          {mlHealth && (
            <View style={[styles.mlBadge, mlOnline ? styles.mlOnline : styles.mlOffline]}>
              <View style={[styles.mlDot, { backgroundColor: mlOnline ? colors.success : colors.warning }]} />
              <Text style={[styles.mlText, { color: mlOnline ? colors.success : colors.warning }]}>
                {mlOnline ? "ML" : "Offline"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Scan Button */}
      <Pressable
        style={[styles.scanBtn, (scanMutation.isPending || !mlOnline) && styles.disabled]}
        onPress={handleScan}
        disabled={scanMutation.isPending || !mlOnline}
      >
        <Ionicons
          name={scanMutation.isPending ? "sync" : "shield-checkmark-outline"}
          size={16}
          color="#fff"
        />
        <Text style={styles.scanBtnText}>
          {scanMutation.isPending ? "Scanning..." : "Run Scan"}
        </Text>
      </Pressable>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={metricsLoading}
            onRefresh={refetchMetrics}
            tintColor={colors.accent}
          />
        }
      >
        {tab === "metrics" ? (
          <MetricsContent metrics={metrics} loading={metricsLoading} mlHealth={mlHealth} />
        ) : (
          <ScanContent scanResult={scanResult} mlOnline={mlOnline} />
        )}
      </ScrollView>
    </View>
  );
}

function MetricsContent({
  metrics,
  loading,
  mlHealth,
}: {
  metrics: NodeMetricsData[];
  loading: boolean;
  mlHealth: any;
}) {
  if (loading) {
    return <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />;
  }

  return (
    <View>
      {/* ML Health Cards */}
      {mlHealth && (
        <View style={styles.healthGrid}>
          <View style={styles.healthCard}>
            <Text style={styles.healthLabel}>VERSION</Text>
            <Text style={styles.healthValue}>{mlHealth.version}</Text>
          </View>
          <View style={styles.healthCard}>
            <Text style={styles.healthLabel}>ROUTE SCORER</Text>
            <View style={styles.healthRow}>
              <Ionicons
                name={mlHealth.models_loaded?.route_scorer ? "checkmark-circle" : "alert-circle"}
                size={14}
                color={mlHealth.models_loaded?.route_scorer ? colors.success : colors.warning}
              />
              <Text style={styles.healthValue}>
                {mlHealth.models_loaded?.route_scorer ? "Loaded" : "---"}
              </Text>
            </View>
          </View>
          <View style={styles.healthCard}>
            <Text style={styles.healthLabel}>ANOMALY DET.</Text>
            <View style={styles.healthRow}>
              <Ionicons
                name={mlHealth.models_loaded?.anomaly_detector ? "checkmark-circle" : "alert-circle"}
                size={14}
                color={mlHealth.models_loaded?.anomaly_detector ? colors.success : colors.warning}
              />
              <Text style={styles.healthValue}>
                {mlHealth.models_loaded?.anomaly_detector ? "Loaded" : "---"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Node Metrics */}
      {metrics.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="wifi-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No node metrics yet</Text>
          <Text style={styles.emptySub}>
            Metrics accumulate as transfers are routed through your mesh
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionLabel}>Active Nodes ({metrics.length})</Text>
          {metrics.map((node) => (
            <NodeMetricsCard key={node.node_id} node={node} />
          ))}
        </>
      )}
    </View>
  );
}

function NodeMetricsCard({ node }: { node: NodeMetricsData }) {
  const uptimePercent = (node.uptime * 100).toFixed(1);
  const uptimeColor =
    node.uptime >= 0.95 ? colors.success : node.uptime >= 0.8 ? colors.warning : colors.error;
  const successRate = ((1 - node.failure_rate) * 100).toFixed(0);

  return (
    <View style={styles.nodeCard}>
      {/* Header */}
      <View style={styles.nodeHeader}>
        <Text style={styles.nodeId}>{truncateId(node.node_id)}</Text>
        <Text style={[styles.uptimeText, { color: uptimeColor }]}>{uptimePercent}% uptime</Text>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>EVENTS</Text>
          <Text style={styles.metricValue}>{node.total_events}</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>SUCCESS</Text>
          <Text style={[styles.metricValue, { color: colors.success }]}>{successRate}%</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>AVG LAT.</Text>
          <Text style={styles.metricValue}>{node.avg_latency_ms.toFixed(0)}ms</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>P95 LAT.</Text>
          <Text style={styles.metricValue}>{node.p95_latency_ms.toFixed(0)}ms</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>THROUGHPUT</Text>
          <Text style={styles.metricValue}>{formatBytes(node.total_bytes)}</Text>
        </View>
      </View>

      {/* Health Bar */}
      {node.total_events > 0 && (
        <View style={styles.healthBarWrap}>
          <View style={styles.healthBarMeta}>
            <Text style={styles.healthBarLabel}>Health</Text>
            <Text style={styles.healthBarLabel}>
              {node.failures} failures / {node.total_events} events
            </Text>
          </View>
          <View style={styles.healthBarBg}>
            <View
              style={[
                styles.healthBarFill,
                {
                  width: `${(1 - node.failure_rate) * 100}%`,
                  backgroundColor:
                    node.failure_rate < 0.05
                      ? colors.success
                      : node.failure_rate < 0.2
                        ? colors.warning
                        : colors.error,
                },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function ScanContent({
  scanResult,
  mlOnline,
}: {
  scanResult: ScanResponse | null;
  mlOnline: boolean;
}) {
  if (!scanResult) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="pulse-outline" size={40} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>
          {mlOnline ? "Run a scan to check for anomalies" : "ML service is offline"}
        </Text>
      </View>
    );
  }

  const { summary, nodes } = scanResult;

  return (
    <View>
      {/* Summary Stats */}
      <View style={styles.summaryGrid}>
        {[
          { label: "Nodes", value: String(summary.total), color: colors.text },
          { label: "Scanned", value: String(summary.scanned), color: colors.accent },
          {
            label: "Anomalies",
            value: String(summary.anomalies),
            color: summary.anomalies > 0 ? colors.error : colors.success,
          },
          {
            label: "Avg Score",
            value: (summary.avg_score * 100).toFixed(0) + "%",
            color: colors.accent,
          },
        ].map((item) => (
          <View key={item.label} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{item.label.toUpperCase()}</Text>
            <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* Node Results */}
      <Text style={styles.sectionLabel}>Scan Results</Text>
      {nodes.length === 0 ? (
        <Text style={styles.noResults}>No nodes found</Text>
      ) : (
        nodes.map((node) => <ScanNodeCard key={node.node_id} node={node} />)
      )}
    </View>
  );
}

function ScanNodeCard({ node }: { node: NodeScanResult }) {
  const scorePercent = (node.score * 100).toFixed(0);
  const scoreColor =
    node.score >= 0.7 ? colors.success : node.score >= 0.4 ? colors.warning : colors.error;

  return (
    <View
      style={[
        styles.scanCard,
        node.is_anomaly && { borderColor: "rgba(248,113,113,0.25)" },
      ]}
    >
      <View style={styles.scanCardRow}>
        {/* Icon */}
        <View
          style={[
            styles.scanIcon,
            {
              backgroundColor: node.is_anomaly
                ? "rgba(248,113,113,0.1)"
                : "rgba(52,211,153,0.08)",
              borderColor: node.is_anomaly
                ? "rgba(248,113,113,0.2)"
                : "rgba(52,211,153,0.2)",
            },
          ]}
        >
          <Ionicons
            name={node.is_anomaly ? "warning-outline" : "shield-checkmark-outline"}
            size={18}
            color={node.is_anomaly ? colors.error : colors.success}
          />
        </View>

        {/* Info */}
        <View style={styles.scanInfo}>
          <Text style={styles.scanNodeId}>{truncateId(node.node_id)}</Text>
          <Text style={styles.scanStatus}>
            {node.is_anomaly
              ? "Anomalous behaviour detected"
              : node.has_metrics
                ? "Healthy"
                : "No metrics yet"}
          </Text>
        </View>

        {/* Score */}
        {node.has_metrics && (
          <View style={styles.scanScores}>
            <View style={styles.scoreCol}>
              <Text style={styles.scoreLabel}>SCORE</Text>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>{scorePercent}%</Text>
            </View>
            {node.is_anomaly && (
              <View style={styles.anomalyBadge}>
                <Text style={styles.anomalyBadgeText}>ANOMALY</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.md },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  header: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  mlBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  mlOnline: {
    backgroundColor: "rgba(52,211,153,0.06)",
    borderColor: "rgba(52,211,153,0.15)",
  },
  mlOffline: {
    backgroundColor: "rgba(251,191,36,0.06)",
    borderColor: "rgba(251,191,36,0.15)",
  },
  mlDot: { width: 6, height: 6, borderRadius: 3 },
  mlText: { fontSize: 11, fontWeight: "600" },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  scanBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  tabActive: { backgroundColor: colors.accentDim },
  tabText: { fontSize: 13, fontWeight: "500", color: colors.textSecondary },
  tabTextActive: { color: colors.accent },
  scrollContent: { paddingBottom: 120 },

  // ML Health
  healthGrid: { flexDirection: "row", gap: 8, marginBottom: spacing.md },
  healthCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 12,
  },
  healthLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  healthValue: { fontSize: 13, fontWeight: "500", color: colors.text },
  healthRow: { flexDirection: "row", alignItems: "center", gap: 5 },

  // Node Metrics
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 10,
  },
  nodeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    marginBottom: 10,
  },
  nodeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  nodeId: { fontSize: 13, fontWeight: "600", color: colors.text, fontFamily: "monospace" },
  uptimeText: { fontSize: 12, fontWeight: "500" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metricCell: { minWidth: "28%", flex: 1 },
  metricLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.7,
    marginBottom: 3,
  },
  metricValue: { fontSize: 14, fontWeight: "600", color: colors.text, fontFamily: "monospace" },
  healthBarWrap: { marginTop: 12 },
  healthBarMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  healthBarLabel: { fontSize: 10, color: colors.textMuted },
  healthBarBg: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.inputBg,
    overflow: "hidden",
  },
  healthBarFill: { height: "100%", borderRadius: 2 },

  // Scan
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 14,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  summaryValue: { fontSize: 22, fontWeight: "700", fontFamily: "monospace" },
  scanCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 14,
    marginBottom: 8,
  },
  scanCardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  scanIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scanInfo: { flex: 1 },
  scanNodeId: { fontSize: 13, fontWeight: "600", color: colors.text, fontFamily: "monospace" },
  scanStatus: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  scanScores: { flexDirection: "row", alignItems: "center", gap: 10 },
  scoreCol: { alignItems: "flex-end" },
  scoreLabel: { fontSize: 9, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.7 },
  scoreValue: { fontSize: 16, fontWeight: "700", fontFamily: "monospace" },
  anomalyBadge: {
    backgroundColor: "rgba(248,113,113,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  anomalyBadgeText: { fontSize: 10, fontWeight: "700", color: colors.error },
  noResults: { color: colors.textMuted, fontSize: 13, textAlign: "center", marginTop: 32 },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 8 },
  emptyTitle: { color: colors.textMuted, fontSize: 15, fontWeight: "500", textAlign: "center" },
  emptySub: { color: colors.textMuted, fontSize: 13, textAlign: "center", maxWidth: 280 },
});
