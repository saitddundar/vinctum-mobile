import { useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, TextInput, Alert } from "react-native";
import { useNodeTransfers } from "../../src/features/transfer/hooks/useTransfers";
import { useUpload } from "../../src/features/transfer/hooks/useUpload";
import { useDownload } from "../../src/features/transfer/hooks/useDownload";
import { Transfer, TransferStatus } from "../../src/features/transfer/types";
import { getStoredDeviceId } from "../../src/lib/device";
import { colors, spacing, radius } from "../../src/lib/theme";

const statusLabel: Record<string, string> = {
  [TransferStatus.PENDING]: "Bekliyor",
  [TransferStatus.IN_PROGRESS]: "Aktarılıyor",
  [TransferStatus.COMPLETED]: "Tamamlandı",
  [TransferStatus.CANCELLED]: "İptal",
  [TransferStatus.FAILED]: "Başarısız",
};

const statusColor: Record<string, string> = {
  [TransferStatus.PENDING]: colors.warning,
  [TransferStatus.IN_PROGRESS]: colors.accent,
  [TransferStatus.COMPLETED]: colors.success,
  [TransferStatus.CANCELLED]: colors.textMuted,
  [TransferStatus.FAILED]: colors.error,
};

export default function TransfersScreen() {
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [receiverNodeId, setReceiverNodeId] = useState("");
  const [receiverPubKey, setReceiverPubKey] = useState("");
  const [inputFocused, setInputFocused] = useState<string | null>(null);
  const { data: transfers, isLoading } = useNodeTransfers(nodeId || "");
  const uploadHook = useUpload();
  const downloadHook = useDownload();

  useEffect(() => {
    getStoredDeviceId().then((id) => setNodeId(id));
  }, []);

  const handleSend = async () => {
    if (!receiverNodeId || !receiverPubKey) {
      Alert.alert("Hata", "Alıcı node ID ve public key gerekli");
      return;
    }
    try {
      const tid = await uploadHook.upload(receiverNodeId, receiverPubKey);
      Alert.alert("Başarılı", `Transfer başlatıldı: ${tid}`);
      setReceiverNodeId("");
      setReceiverPubKey("");
    } catch (e: any) {
      Alert.alert("Hata", e?.response?.data?.error || e?.message || "Gönderim başarısız");
    }
  };

  const handleDownload = (t: Transfer) => {
    downloadHook
      .download(t.transfer_id, t.sender_ephemeral_pubkey, t.filename)
      .then((path) => Alert.alert("İndirildi", `Dosya: ${path}`))
      .catch((e) => Alert.alert("Hata", e?.message || "İndirme başarısız"));
  };

  return (
    <View style={styles.container}>
      <View style={styles.sendSection}>
        <Text style={styles.sectionTitle}>Dosya Gönder</Text>
        <TextInput
          style={[styles.input, inputFocused === "node" && styles.inputFocused]}
          placeholder="Alıcı Node ID"
          placeholderTextColor={colors.textMuted}
          value={receiverNodeId}
          onChangeText={setReceiverNodeId}
          autoCapitalize="none"
          onFocus={() => setInputFocused("node")}
          onBlur={() => setInputFocused(null)}
        />
        <TextInput
          style={[styles.input, inputFocused === "key" && styles.inputFocused]}
          placeholder="Alıcı Public Key (base64)"
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
              ? `Yükleniyor ${uploadHook.progress}/${uploadHook.totalChunks}`
              : "Dosya Seç ve Gönder"}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Transferler</Text>
      <FlatList
        data={transfers}
        keyExtractor={(t) => t.transfer_id}
        renderItem={({ item }) => (
          <View style={styles.card}>
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
            {item.status === TransferStatus.COMPLETED && item.receiver_node_id === nodeId && (
              <Pressable style={styles.downloadBtn} onPress={() => handleDownload(item)}>
                <Text style={styles.downloadText}>İndir</Text>
              </Pressable>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>{isLoading ? "Yükleniyor..." : "Transfer yok"}</Text>
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
  downloadBtn: { marginTop: 8, alignSelf: "flex-end" },
  downloadText: { color: colors.accent, fontWeight: "600", fontSize: 14 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 40 },
});
