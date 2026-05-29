import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useNodeTransfersPaginated,
  useCancelTransfer,
  usePauseTransfer,
  useResumeTransfer,
} from "../../src/features/transfer/hooks/useTransfers";
import { useTransferEvents } from "../../src/features/transfer/hooks/useTransferEvents";
import { useUpload } from "../../src/features/transfer/hooks/useUpload";
import { useSessionTransfer } from "../../src/features/transfer/hooks/useSessionTransfer";
import { useDownload } from "../../src/features/transfer/hooks/useDownload";
import { useRespondToTransfer } from "../../src/features/friends/hooks/useFriends";
import { Transfer, TransferStatus } from "../../src/features/transfer/types";
import { Device } from "../../src/features/devices/types";
import { Session } from "../../src/features/sessions/types";
import { getStoredDeviceId } from "../../src/lib/device";
import { toast } from "../../src/lib/toast";
import { colors, spacing, radius } from "../../src/lib/theme";
import DevicePicker from "../../src/components/DevicePicker";
import SessionPicker from "../../src/components/SessionPicker";
import FriendDevicePicker from "../../src/components/FriendDevicePicker";
import {
  IncomingTransferBanner,
  useIncomingTransfers,
} from "../../src/components/IncomingTransferBanner";

const statusColor: Record<string, string> = {
  [TransferStatus.PENDING]: colors.warning,
  [TransferStatus.IN_PROGRESS]: colors.accent,
  [TransferStatus.PAUSED]: colors.warning,
  [TransferStatus.COMPLETED]: colors.success,
  [TransferStatus.CANCELLED]: colors.textMuted,
  [TransferStatus.FAILED]: colors.error,
  [TransferStatus.AWAITING_APPROVAL]: colors.blue,
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

type FilterType = "all" | "active" | "done";

export default function TransfersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [showSend, setShowSend] = useState(false);
  const [sendMode, setSendMode] = useState<"device" | "session" | "friend">("device");
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const { data: transferPages, isLoading, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNodeTransfersPaginated(nodeId || "");
  const transfers = transferPages?.pages.flatMap((p) => p.transfers) ?? [];
  const uploadHook = useUpload();
  const sessionTransferHook = useSessionTransfer();
  const downloadHook = useDownload();
  const cancel = useCancelTransfer();
  const pause = usePauseTransfer();
  const resume = useResumeTransfer();
  const respondTransfer = useRespondToTransfer();

  const handleDownload = useCallback(
    (t: Transfer) => {
      setActiveDownloadId(t.transfer_id);
      downloadHook
        .download(
          t.transfer_id,
          t.sender_ephemeral_pubkey,
          t.filename,
          t.wrapped_file_key
        )
        .then((path) => toast.success(`Saved: ${path.split("/").pop()}`))
        .catch((e: any) => toast.error(e?.message || "Download failed"))
        .finally(() => setActiveDownloadId(null));
    },
    [downloadHook]
  );

  const { incoming, handleEvent, dismiss } = useIncomingTransfers(nodeId, {
    onDownload: handleDownload,
    onDismiss: () => {},
  });

  useTransferEvents(nodeId, { onEvent: handleEvent });

  useEffect(() => {
    getStoredDeviceId().then(setNodeId);
  }, []);

  const handleRespond = useCallback(
    (transfer: Transfer, accept: boolean) => {
      respondTransfer.mutate(
        {
          transferId: transfer.transfer_id,
          receiverNodeId: transfer.receiver_node_id,
          accept,
        },
        {
          onSuccess: () => {
            toast.success(accept ? "Transfer accepted" : "Transfer rejected");
            refetch();
          },
          onError: () => toast.error("Failed to respond"),
        }
      );
    },
    [respondTransfer, refetch]
  );

  const filtered = (transfers || []).filter((t) => {
    if (filter === "active")
      return (
        t.status === TransferStatus.PENDING ||
        t.status === TransferStatus.IN_PROGRESS ||
        t.status === TransferStatus.PAUSED ||
        t.status === TransferStatus.AWAITING_APPROVAL
      );
    if (filter === "done") return t.status === TransferStatus.COMPLETED;
    return true;
  });

  const activeCount = (transfers || []).filter(
    (t) =>
      t.status === TransferStatus.PENDING ||
      t.status === TransferStatus.IN_PROGRESS ||
      t.status === TransferStatus.PAUSED ||
      t.status === TransferStatus.AWAITING_APPROVAL
  ).length;

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

  const handleSessionSelect = async (
    session: Session,
    deviceKeys: {
      device_id: string;
      node_id: string;
      kex_public_key: string;
    }[]
  ) => {
    try {
      const gid = await sessionTransferHook.upload(
        session.session_id,
        deviceKeys
      );
      if (gid) {
        toast.success(`Sent to ${deviceKeys.length} devices`);
        setShowSend(false);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.message || "Send failed");
    }
  };

  const handleFriendSelect = async (device: Device, pubKey: string) => {
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
              onError: (e: any) =>
                toast.error(e?.response?.data?.error || "Cancel failed"),
            }
          ),
      },
    ]);
  };

  const handlePause = (t: Transfer) => {
    pause.mutate(t.transfer_id, {
      onSuccess: () => toast.success("Transfer paused"),
      onError: (e: any) => toast.error(e?.response?.data?.error || "Pause failed"),
    });
  };

  const handleResume = (t: Transfer) => {
    resume.mutate(t.transfer_id, {
      onSuccess: () => toast.success("Transfer resumed"),
      onError: (e: any) => toast.error(e?.response?.data?.error || "Resume failed"),
    });
  };

  const isDownloading = (id: string) =>
    activeDownloadId === id && downloadHook.downloading;

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "done", label: "Done" },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.header}>Transfers</Text>
          <Text style={styles.headerSub}>
            {activeCount} active · {(transfers || []).length} today
          </Text>
        </View>
        <Pressable
          style={styles.sendBtn}
          onPress={() => setShowSend(!showSend)}
        >
          <Ionicons
            name={showSend ? "close" : "paper-plane-outline"}
            size={16}
            color={colors.bg}
          />
          <Text style={styles.sendBtnText}>{showSend ? "Close" : "Send"}</Text>
        </Pressable>
      </View>

      {/* Send panel */}
      {showSend &&
        (uploadHook.uploading || sessionTransferHook.uploading ? (
          <View style={styles.sendSection}>
            <View style={styles.uploadingRow}>
              <Ionicons
                name="cloud-upload-outline"
                size={16}
                color={colors.accent}
              />
              <Text style={styles.uploadingText}>
                Uploading{" "}
                {uploadHook.uploading
                  ? uploadHook.progress
                  : sessionTransferHook.progress}
                /
                {uploadHook.uploading
                  ? uploadHook.totalChunks
                  : sessionTransferHook.totalChunks}{" "}
                chunks...
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.sendModeToggle}>
              <Pressable
                style={[
                  styles.sendModeBtn,
                  sendMode === "device" && styles.sendModeBtnActive,
                ]}
                onPress={() => setSendMode("device")}
              >
                <Text
                  style={[
                    styles.sendModeText,
                    sendMode === "device" && styles.sendModeTextActive,
                  ]}
                >
                  Device
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.sendModeBtn,
                  sendMode === "session" && styles.sendModeBtnActive,
                ]}
                onPress={() => setSendMode("session")}
              >
                <Text
                  style={[
                    styles.sendModeText,
                    sendMode === "session" && styles.sendModeTextActive,
                  ]}
                >
                  Session
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.sendModeBtn,
                  sendMode === "friend" && styles.sendModeBtnActive,
                ]}
                onPress={() => setSendMode("friend")}
              >
                <Text
                  style={[
                    styles.sendModeText,
                    sendMode === "friend" && styles.sendModeTextActive,
                  ]}
                >
                  Friend
                </Text>
              </Pressable>
            </View>
            {sendMode === "device" ? (
              <DevicePicker
                currentDeviceId={nodeId}
                onSelect={handleDeviceSelect}
                onCancel={() => setShowSend(false)}
              />
            ) : sendMode === "session" ? (
              <SessionPicker
                currentDeviceId={nodeId}
                onSelect={handleSessionSelect}
                onCancel={() => setShowSend(false)}
              />
            ) : (
              <FriendDevicePicker
                onSelect={handleFriendSelect}
                onCancel={() => setShowSend(false)}
              />
            )}
          </>
        ))}

      <IncomingTransferBanner
        transfers={incoming}
        onDownload={handleDownload}
        onDismiss={dismiss}
        onAccept={(t) => handleRespond(t, true)}
        onReject={(t) => handleRespond(t, false)}
      />

      {/* Filters */}
      <View style={styles.filters}>
        {filters.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.key && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.transfer_id}
        renderItem={({ item }) => {
          const downloading = isDownloading(item.transfer_id);
          const canCancel =
            item.status === TransferStatus.PENDING ||
            item.status === TransferStatus.IN_PROGRESS ||
            item.status === TransferStatus.PAUSED;
          const canPause = item.status === TransferStatus.IN_PROGRESS;
          const canResume = item.status === TransferStatus.PAUSED;
          const canDownload =
            item.status === TransferStatus.COMPLETED &&
            item.receiver_node_id === nodeId;
          const col = statusColor[item.status] || colors.accent;
          const isActive =
            item.status === TransferStatus.IN_PROGRESS ||
            item.status === TransferStatus.PENDING ||
            item.status === TransferStatus.PAUSED;

          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/transfers/${item.transfer_id}`)}
            >
              <View style={styles.cardRow}>
                {/* Status icon */}
                <View style={[styles.statusIconWrap, { backgroundColor: col + "18" }]}>
                  <Ionicons
                    name={
                      item.status === TransferStatus.COMPLETED
                        ? "checkmark"
                        : item.status === TransferStatus.PAUSED
                        ? "pause"
                        : item.status === TransferStatus.IN_PROGRESS ||
                          item.status === TransferStatus.PENDING
                        ? "paper-plane-outline"
                        : "close"
                    }
                    size={14}
                    color={col}
                  />
                </View>

                {/* File info */}
                <View style={styles.cardInfo}>
                  <Text style={styles.filename} numberOfLines={1}>
                    {item.filename}
                  </Text>
                  <Text style={styles.meta}>
                    {formatSize(item.total_size_bytes)}
                    {item.status === TransferStatus.COMPLETED && (
                      <Text style={styles.metaTime}>
                        {"  "}
                        {new Date(item.created_at || "").toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </Text>
                    )}
                  </Text>
                </View>

                {/* Right side */}
                <View style={styles.cardRight}>
                  {isActive && (
                    <Text style={[styles.percent, { color: col }]}>
                      {item.progress_percent}%
                    </Text>
                  )}
                  {canDownload && (
                    <Pressable
                      onPress={() => handleDownload(item)}
                      disabled={downloading}
                    >
                      <Text
                        style={[
                          styles.actionText,
                          { color: colors.accent },
                          downloading && { opacity: 0.5 },
                        ]}
                      >
                        {downloading ? "..." : "↓"}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Progress bar */}
              {isActive && (
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${item.progress_percent}%` as any,
                        backgroundColor: col,
                      },
                    ]}
                  />
                </View>
              )}

              {(canPause || canResume || canCancel) && (
                <View style={styles.transferActions}>
                  {canPause && (
                    <Pressable style={styles.pauseBtn} onPress={() => handlePause(item)}>
                      <Text style={styles.pauseText}>Pause</Text>
                    </Pressable>
                  )}
                  {canResume && (
                    <Pressable style={styles.resumeBtn} onPress={() => handleResume(item)}>
                      <Text style={styles.resumeText}>Resume</Text>
                    </Pressable>
                  )}
                  {canCancel && (
                    <Pressable style={styles.cancelBtn} onPress={() => handleCancel(item)}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Awaiting approval actions */}
              {item.status === TransferStatus.AWAITING_APPROVAL &&
                item.receiver_node_id === nodeId && (
                  <View style={styles.awaitingActions}>
                    <Pressable
                      style={styles.rejectBtn}
                      onPress={() => handleRespond(item, false)}
                    >
                      <Text style={styles.rejectText}>Reject</Text>
                    </Pressable>
                    <Pressable
                      style={styles.approveBtn}
                      onPress={() => handleRespond(item, true)}
                    >
                      <Text style={styles.approveText}>Accept</Text>
                    </Pressable>
                  </View>
                )}

            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons
              name="swap-horizontal-outline"
              size={40}
              color={colors.textMuted}
            />
            <Text style={styles.empty}>
              {isLoading ? "Loading..." : "No transfers yet"}
            </Text>
          </View>
        }
        onRefresh={refetch}
        refreshing={isLoading}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Loading more...</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.md },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  header: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  sendBtnText: { color: colors.bg, fontSize: 14, fontWeight: "700" },

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
  },
  uploadingText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  sendModeToggle: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  sendModeBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  sendModeBtnActive: { backgroundColor: colors.accent },
  sendModeText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  sendModeTextActive: { color: colors.bg },

  filters: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.md,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  filterActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterText: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },
  filterTextActive: { color: colors.bg, fontWeight: "700" },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 14,
    marginBottom: 10,
  },
  cardRow: { flexDirection: "row", alignItems: "center" },
  statusIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  filename: { fontSize: 14, fontWeight: "600", color: colors.text },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  metaSpeed: { fontWeight: "600" },
  metaTime: { color: colors.textMuted },
  cardRight: { alignItems: "flex-end", marginLeft: 8 },
  percent: { fontSize: 13, fontWeight: "700" },
  actionText: { fontSize: 16, fontWeight: "700" },
  progressTrack: {
    height: 3,
    backgroundColor: colors.inputBg,
    borderRadius: 2,
    marginTop: 10,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  awaitingActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.errorDim,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.2)",
    alignItems: "center",
  },
  rejectText: { color: colors.error, fontSize: 13, fontWeight: "600" },
  approveBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: "center",
  },
  approveText: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  transferActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
  },
  pauseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  pauseText: { color: colors.warning, fontSize: 12, fontWeight: "600" },
  resumeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  resumeText: { color: colors.accent, fontSize: 12, fontWeight: "600" },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.errorDim,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.2)",
  },
  cancelText: { color: colors.error, fontSize: 12, fontWeight: "600" },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 12 },
  empty: { color: colors.textMuted, fontSize: 14 },
});
