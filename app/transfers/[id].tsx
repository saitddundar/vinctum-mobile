import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTransferDetail } from "../../src/features/transfer/hooks/useTransfers";
import { useTransferEvents } from "../../src/features/transfer/hooks/useTransferEvents";
import { TransferStatus } from "../../src/features/transfer/types";
import { getStoredDeviceId } from "../../src/lib/device";
import { colors, radius, spacing } from "../../src/lib/theme";

const statusLabel: Record<string, string> = {
  [TransferStatus.PENDING]: "Pending",
  [TransferStatus.IN_PROGRESS]: "In progress",
  [TransferStatus.COMPLETED]: "Completed",
  [TransferStatus.CANCELLED]: "Cancelled",
  [TransferStatus.FAILED]: "Failed",
};

const statusColor: Record<string, string> = {
  [TransferStatus.PENDING]: colors.warning,
  [TransferStatus.IN_PROGRESS]: colors.accent,
  [TransferStatus.COMPLETED]: colors.success,
  [TransferStatus.CANCELLED]: colors.textMuted,
  [TransferStatus.FAILED]: colors.error,
};

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function fmtDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export default function TransferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [nodeId, setNodeId] = useState<string | null>(null);
  const { data, isLoading, error } = useTransferDetail(id || "");

  useEffect(() => {
    getStoredDeviceId().then(setNodeId);
  }, []);

  useTransferEvents(nodeId);

  const stats = useMemo(() => {
    if (!data) return null;
    const startedAt = new Date(data.started_at).getTime();
    const updatedAt = new Date(data.updated_at).getTime();
    const elapsedMs = Math.max(0, updatedAt - startedAt);
    const throughput =
      elapsedMs > 0 ? data.bytes_transferred / (elapsedMs / 1000) : 0;
    const remaining = data.total_bytes - data.bytes_transferred;
    const etaMs = throughput > 0 ? (remaining / throughput) * 1000 : 0;
    const percent =
      data.total_chunks > 0
        ? Math.round((data.chunks_transferred / data.total_chunks) * 100)
        : 0;
    return { elapsedMs, throughput, etaMs, percent };
  }, [data]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Transfer Detail",
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {isLoading && <Text style={styles.muted}>Loading…</Text>}
        {error && <Text style={[styles.muted, { color: colors.error }]}>Failed to load</Text>}

        {data && stats && (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>Status</Text>
              <Text style={[styles.statusValue, { color: statusColor[data.status] }]}>
                {statusLabel[data.status] || data.status}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${stats.percent}%`, backgroundColor: statusColor[data.status] },
                  ]}
                />
              </View>
              <Text style={styles.muted}>
                {data.chunks_transferred} / {data.total_chunks} chunks ({stats.percent}%)
              </Text>
            </View>

            <View style={styles.card}>
              <Row label="Transferred" value={`${fmtBytes(data.bytes_transferred)} / ${fmtBytes(data.total_bytes)}`} />
              <Row label="Throughput" value={`${fmtBytes(stats.throughput)}/s`} />
              <Row label="Elapsed" value={fmtDuration(stats.elapsedMs)} />
              {data.status === TransferStatus.IN_PROGRESS && stats.etaMs > 0 && (
                <Row label="ETA" value={fmtDuration(stats.etaMs)} />
              )}
            </View>

            <View style={styles.card}>
              <Row label="Transfer ID" value={data.transfer_id} mono />
              <Row label="Started" value={new Date(data.started_at).toLocaleString()} />
              <Row label="Updated" value={new Date(data.updated_at).toLocaleString()} />
              <Row label="Sender ephemeral key" value={data.sender_ephemeral_pubkey} mono />
            </View>
          </>
        )}

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, mono && styles.mono]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  statusValue: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  progressTrack: {
    height: 6,
    backgroundColor: colors.inputBg,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%", borderRadius: 3 },
  muted: { fontSize: 13, color: colors.textSecondary },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, gap: spacing.md },
  rowLabel: { color: colors.textSecondary, fontSize: 13 },
  rowValue: { color: colors.text, fontSize: 13, flexShrink: 1, textAlign: "right" },
  mono: { fontFamily: "Courier", fontSize: 11 },
  backBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    padding: 14,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  backText: { color: colors.text, fontSize: 15, fontWeight: "600" },
});
