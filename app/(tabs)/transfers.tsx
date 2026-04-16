import { useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useNodeTransfers, useCancelTransfer } from "../../src/features/transfer/hooks/useTransfers";
import { useTransferEvents } from "../../src/features/transfer/hooks/useTransferEvents";
import { useUpload } from "../../src/features/transfer/hooks/useUpload";
import { useDownload } from "../../src/features/transfer/hooks/useDownload";
import { Transfer, TransferStatus } from "../../src/features/transfer/types";
import { getStoredDeviceId } from "../../src/lib/device";
import { toast } from "../../src/lib/toast";
import { colors, spacing, radius } from "../../src/lib/theme";

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

export default function TransfersScreen() {
  const router = useRouter();
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [receiverNodeId, setReceiverNodeId] = useState("");
  const [receiverPubKey, setReceiverPubKey] = useState("");
  const [inputFocused, setInputFocused] = useState<string | null>(null);
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  const { data: transfers, isLoading } = useNodeTransfers(nodeId || "");
  const uploadHook = useUpload();
  const downloadHook = useDownload();
  const cancel = useCancelTransfer();

  useTransferEvents(nodeId);

  useEffect(() => {
    getStoredDeviceId().then((id) => setNodeId(id));
  }, []);

  const handleSend = async () => {
    if (!receiverNodeId || !receiverPubKey) {
      toast.error("Receiver node ID and public key are required");
      return;
    }
    try {
      const tid = await uploadHook.upload(receiverNodeId, receiverPubKey);
      toast.success(`Transfer started: ${tid.slice(0, 8)}…`);
      setReceiverNodeId("");
      setReceiverPubKey("");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.message || "Send failed");
    }
  };

  const handleDownload = (t: Transfer) => {
    setActiveDownloadId(t.transfer_id);
    downloadHook
      .download(t.transfer_id, t.sender_ephemeral_pubkey, t.filename)
      .then((path) => toast.success(`Saved: ${path.split("/").pop()}`))
      .catch((e) => toast.error(e?.message || "Download failed"))
      .finally(() => setActiveDownloadId(null));
  };

  const handleCancel = (t: Transfer) => {
    Alert.alert("Cancel Transfer", `Cancel transfer of "${t.filename}"?`, [
      { text: "Keep" },
      {
        text: "Cancel transfer",
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
  const downloadPercent = (id: string) =>
    isDownloading(id) && downloadHook.totalChunks > 0
      ? Math.round((downloadHook.progress / downloadHook.totalChunks) * 100)
      : 0;

  return (
    <View style={styles.container}>
      <View style={styles.sendSection}>
        <Text style={styles.sectionTitle}>Send File</Text>
        <TextInput
          style={[styles.input, inputFocused === "node" && styles.inputFocused]}
          placeholder="Receiver Node ID"
          placeholderTextColor={colors.textMuted}
          value={receiverNodeId}
          onChangeText={setReceiverNodeId}
          autoCapitalize="none"
          onFocus={() => setInputFocused("node")}
          onBlur={() => setInputFocused(null)}
        />
        <TextInput
          style={[styles.input, inputFocused === "key" && styles.inputFocused]}
          placeholder="Receiver Public Key (base64)"
          placeholderTextColor={colors.textMuted}
          value={receiverPubKey}
          onChangeText={setReceiverPubKey}
          autoCapitalize="none"
          onFocus={() => setInputFocused("key")}
          onBlur={() => setInputFocused(null)}
        />
        <Pressable
          style={[styles.button, uploadHook.uploading && styles.disabled]}
          onPress={handleSend}
          disabled={uploadHook.uploading}
        >
          <Text style={styles.buttonText}>
            {uploadHook.uploading
              ? `Uploading ${uploadHook.progress}/${uploadHook.totalChunks}`
              : "Pick File and Send"}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Transfers</Text>
      <FlatList
        data={transfers}
        keyExtractor={(t) => t.transfer_id}
        renderItem={({ item }) => {
          const downloading = isDownloading(item.transfer_id);
          const dlPercent = downloadPercent(item.transfer_id);
          const canCancel =
            item.status === TransferStatus.PENDING || item.status === TransferStatus.IN_PROGRESS;
          const canDownload =
            item.status === TransferStatus.COMPLETED && item.receiver_node_id === nodeId;

          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/transfers/${item.transfer_id}`)}
            >
              <View style={styles.cardRow}>
                <Text style={styles.filename} numberOfLines={1}>{item.filename}</Text>
                <Text style={[styles.status, { color: statusColor[item.status] }]}>
                  {statusLabel[item.status] || item.status}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, {
                  width: `${item.progress_percent}%`,
                  backgroundColor: statusColor[item.status] || colors.accent,
                }]} />
              </View>
              <Text style={styles.meta}>
                {(item.total_size_bytes / 1024).toFixed(0)} KB • {item.progress_percent}%
              </Text>

              {downloading && (
                <>
                  <View style={[styles.progressTrack, { marginTop: 6 }]}>
                    <View style={[styles.progressFill, { width: `${dlPercent}%`, backgroundColor: colors.accent }]} />
                  </View>
                  <Text style={styles.meta}>
                    Downloading {downloadHook.progress}/{downloadHook.totalChunks} ({dlPercent}%)
                  </Text>
                </>
              )}

              <View style={styles.actionsRow}>
                {canCancel && (
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => handleCancel(item)}
                    disabled={cancel.isPending}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                )}
                {canDownload && (
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => handleDownload(item)}
                    disabled={downloading}
                  >
                    <Text style={[styles.downloadText, downloading && styles.disabledText]}>
                      {downloading ? "Downloading..." : "Download"}
                    </Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>{isLoading ? "Loading..." : "No transfers"}</Text>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  sendSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 14,
    marginBottom: 8,
    color: colors.text,
  },
  inputFocused: { borderColor: colors.inputBorderFocus },
  button: {
    backgroundColor: colors.accent,
    padding: 14,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: 4,
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 14,
    marginBottom: 10,
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  filename: { fontSize: 15, fontWeight: "500", flex: 1, marginRight: 8, color: colors.text },
  status: { fontSize: 13, fontWeight: "600" },
  progressTrack: {
    height: 3,
    backgroundColor: colors.inputBg,
    borderRadius: 2,
    marginBottom: 6,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  meta: { fontSize: 12, color: colors.textSecondary },
  actionsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 16, marginTop: 8 },
  actionBtn: { paddingVertical: 4 },
  downloadText: { color: colors.accent, fontWeight: "600", fontSize: 14 },
  cancelText: { color: colors.error, fontWeight: "600", fontSize: 14 },
  disabledText: { opacity: 0.5 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 40 },
});
