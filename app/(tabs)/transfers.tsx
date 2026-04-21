import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNodeTransfers, useCancelTransfer } from "../../src/features/transfer/hooks/useTransfers";
import { useTransferEvents } from "../../src/features/transfer/hooks/useTransferEvents";
import { useUpload } from "../../src/features/transfer/hooks/useUpload";
import { useDownload } from "../../src/features/transfer/hooks/useDownload";
import { Transfer, TransferStatus } from "../../src/features/transfer/types";
import { Device } from "../../src/features/devices/types";
import { getStoredDeviceId } from "../../src/lib/device";
import { toast } from "../../src/lib/toast";
import { colors, spacing, radius } from "../../src/lib/theme";
import DevicePicker from "../../src/components/DevicePicker";
import { IncomingTransferBanner, useIncomingTransfers } from "../../src/components/IncomingTransferBanner";

const statusColor: Record<string, string> = {
  [TransferStatus.PENDING]: colors.warning,
  [TransferStatus.IN_PROGRESS]: colors.accent,
  [TransferStatus.COMPLETED]: colors.success,
  [TransferStatus.CANCELLED]: colors.textMuted,
  [TransferStatus.FAILED]: colors.error,
};

const statusIcon: Record<string, string> = {
  [TransferStatus.PENDING]: "time-outline",
  [TransferStatus.IN_PROGRESS]: "arrow-up-circle-outline",
  [TransferStatus.COMPLETED]: "checkmark-circle-outline",
  [TransferStatus.CANCELLED]: "close-circle-outline",
  [TransferStatus.FAILED]: "alert-circle-outline",
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TransfersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [showSend, setShowSend] = useState(false);
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const { data: transfers, isLoading, refetch } = useNodeTransfers(nodeId || "");
  const uploadHook = useUpload();
  const downloadHook = useDownload();
  const cancel = useCancelTransfer();

  const handleDownload = useCallback((t: Transfer) => {
    setActiveDownloadId(t.transfer_id);
    downloadHook
      .download(t.transfer_id, t.sender_ephemeral_pubkey, t.filename)
      .then((path) => toast.success(`Saved: ${path.split("/").pop()}`))
      .catch((e: any) => toast.error(e?.message || "Download failed"))
      .finally(() => setActiveDownloadId(null));
  }, [downloadHook]);

  const { incoming, handleEvent, dismiss } = useIncomingTransfers(nodeId, {
    onDownload: handleDownload,
    onDismiss: () => {},
  });

  useTransferEvents(nodeId, { onEvent: handleEvent });

  useEffect(() => {
    getStoredDeviceId().then(setNodeId);
  }, []);

  const filtered = (transfers || []).filter((t) => {
    if (filter === "active") return t.status === TransferStatus.PENDING || t.status === TransferStatus.IN_PROGRESS;
    if (filter === "done") return t.status === TransferStatus.COMPLETED;
    return true;
  });

  const handleDeviceSelect = async (device: Device, pubKey: string) => {
    try {
      const tid = await uploadHook.upload(device.node_id, pubKey);
      if (tid) {
        toast.success("Transfer started");
        setShowSend(false);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.message || "Send failed");
    }
  };

  const handleCancel = (t: Transfer) => {
    Alert.alert("Cancel Transfer", `Cancel "${t.filename}"?`, [
      { text: "Keep" },
      {
        text: "Cancel",
        style: "destructive",
        onPress: () =>
          cancel.mutate(
            { transferId: t.transfer_id, reason: "user cancelled" },
            {
              onSuccess: () => toast.success("Transfer cancelled"),
              onError: (e: any) => toast.error(e?.response?.data?.error || "Cancel failed"),
            }
          ),
      },
    ]);
  };

  const isDownloading = (id: string) => activeDownloadId === id && downloadHook.downloading;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topRow}>
        <Text style={styles.header}>Transfers</Text>
        <Pressable style={styles.sendToggle} onPress={() => setShowSend(!showSend)}>
          <Ionicons name={showSend ? "close" : "add"} size={20} color="#fff" />
        </Pressable>
      </View>

      {showSend && (
        uploadHook.uploading ? (
          <View style={styles.sendSection}>
            <View style={styles.uploadingRow}>
              <Ionicons name="cloud-upload-outline" size={18} color={colors.accent} />
              <Text style={styles.uploadingText}>
                Uploading {uploadHook.progress}/{uploadHook.totalChunks} chunks...
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {
                width: `${uploadHook.totalChunks > 0 ? Math.round((uploadHook.progress / uploadHook.totalChunks) * 100) : 0}%`,
                backgroundColor: colors.accent,
              }]} />
            </View>
          </View>
        ) : (
          <DevicePicker
            currentDeviceId={nodeId}
            onSelect={handleDeviceSelect}
            onCancel={() => setShowSend(false)}
          />
        )
      )}

      <IncomingTransferBanner
        transfers={incoming}
        onDownload={handleDownload}
        onDismiss={dismiss}
      />

      <View style={styles.filters}>
        {(["all", "active", "done"] as const).map((f) => (
          <Pressable key={f} style={[styles.filterBtn, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "all" ? "All" : f === "active" ? "Active" : "Completed"}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.transfer_id}
        renderItem={({ item }) => {
          const downloading = isDownloading(item.transfer_id);
          const canCancel = item.status === TransferStatus.PENDING || item.status === TransferStatus.IN_PROGRESS;
          const canDownload = item.status === TransferStatus.COMPLETED && item.receiver_node_id === nodeId;
          const col = statusColor[item.status] || colors.accent;

          return (
            <Pressable style={styles.card} onPress={() => router.push(`/transfers/${item.transfer_id}`)}>
              <View style={styles.cardTop}>
                <View style={[styles.statusDot, { backgroundColor: col }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.filename} numberOfLines={1}>{item.filename}</Text>
                  <Text style={styles.meta}>{formatSize(item.total_size_bytes)}</Text>
                </View>
                <Ionicons name={statusIcon[item.status] as any} size={20} color={col} />
              </View>

              {(item.status === TransferStatus.IN_PROGRESS || item.status === TransferStatus.PENDING) && (
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${item.progress_percent}%`, backgroundColor: col }]} />
                </View>
              )}

              {downloading && (
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, {
                    width: `${downloadHook.totalChunks > 0 ? Math.round((downloadHook.progress / downloadHook.totalChunks) * 100) : 0}%`,
                    backgroundColor: colors.accent,
                  }]} />
                </View>
              )}

              <View style={styles.cardActions}>
                <Text style={[styles.percent, { color: col }]}>{item.progress_percent}%</Text>
                <View style={{ flexDirection: "row", gap: 16 }}>
                  {canCancel && (
                    <Pressable onPress={() => handleCancel(item)}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                  )}
                  {canDownload && (
                    <Pressable onPress={() => handleDownload(item)} disabled={downloading}>
                      <Text style={[styles.downloadText, downloading && { opacity: 0.5 }]}>
                        {downloading ? "Downloading..." : "Download"}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="swap-horizontal-outline" size={40} color={colors.textMuted} />
            <Text style={styles.empty}>{isLoading ? "Loading..." : "No transfers yet"}</Text>
          </View>
        }
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.md },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md, marginTop: spacing.sm },
  header: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  sendToggle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  uploadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  uploadingText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  filters: { flexDirection: "row", gap: 8, marginBottom: spacing.md },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  filterActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  filterText: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },
  filterTextActive: { color: colors.accent },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  filename: { fontSize: 15, fontWeight: "600", color: colors.text },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  progressTrack: { height: 3, backgroundColor: colors.inputBg, borderRadius: 2, marginBottom: 8, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  cardActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  percent: { fontSize: 12, fontWeight: "600" },
  cancelText: { color: colors.error, fontWeight: "600", fontSize: 13 },
  downloadText: { color: colors.accent, fontWeight: "600", fontSize: 13 },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 12 },
  empty: { color: colors.textMuted, fontSize: 14 },
});
