import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Transfer, TransferEvent } from "../features/transfer/types";
import { colors, spacing, radius } from "../lib/theme";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  onDownload: (transfer: Transfer) => void;
  onDismiss: (transferId: string) => void;
}

export function useIncomingTransfers(currentNodeId: string | null, props: Props) {
  const [incoming, setIncoming] = useState<Transfer[]>([]);

  const handleEvent = useCallback(
    (event: TransferEvent) => {
      if (!currentNodeId) return;

      // new transfer where we are the receiver
      if (
        event.type === "EVENT_TYPE_NEW" &&
        event.transfer.receiver_node_id === currentNodeId
      ) {
        setIncoming((prev) => {
          if (prev.some((t) => t.transfer_id === event.transfer.transfer_id)) return prev;
          return [event.transfer, ...prev];
        });
      }

      // completed/cancelled — remove from incoming
      if (
        event.type === "EVENT_TYPE_COMPLETED" ||
        event.type === "EVENT_TYPE_CANCELLED"
      ) {
        setIncoming((prev) => prev.filter((t) => t.transfer_id !== event.transfer.transfer_id));
      }
    },
    [currentNodeId]
  );

  const dismiss = (transferId: string) => {
    setIncoming((prev) => prev.filter((t) => t.transfer_id !== transferId));
    props.onDismiss(transferId);
  };

  return { incoming, handleEvent, dismiss };
}

export function IncomingTransferBanner({
  transfers,
  onDownload,
  onDismiss,
}: {
  transfers: Transfer[];
  onDownload: (t: Transfer) => void;
  onDismiss: (id: string) => void;
}) {
  if (transfers.length === 0) return null;

  return (
    <View style={styles.container}>
      {transfers.map((t) => (
        <View key={t.transfer_id} style={styles.banner}>
          <View style={styles.iconWrap}>
            <Ionicons name="download-outline" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              Incoming: {t.filename}
            </Text>
            <Text style={styles.meta}>{formatSize(t.total_size_bytes)}</Text>
          </View>
          <Pressable style={styles.downloadBtn} onPress={() => onDownload(t)}>
            <Text style={styles.downloadText}>Download</Text>
          </Pressable>
          <Pressable onPress={() => onDismiss(t.transfer_id)} hitSlop={8}>
            <Ionicons name="close" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, marginBottom: spacing.sm },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentDim,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(124, 91, 245, 0.25)",
    padding: 12,
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(124, 91, 245, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 13, fontWeight: "600", color: colors.text },
  meta: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  downloadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
  },
  downloadText: { fontSize: 12, fontWeight: "600", color: "#fff" },
});
