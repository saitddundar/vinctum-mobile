import { useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, TextInput, Alert } from "react-native";
import { useNodeTransfers } from "../../src/features/transfer/hooks/useTransfers";
import { useUpload } from "../../src/features/transfer/hooks/useUpload";
import { useDownload } from "../../src/features/transfer/hooks/useDownload";
import { Transfer, TransferStatus } from "../../src/features/transfer/types";
import { getStoredDeviceId } from "../../src/lib/device";
import { useEffect } from "react";

const statusLabel: Record<string, string> = {
  [TransferStatus.PENDING]: "Bekliyor",
  [TransferStatus.IN_PROGRESS]: "Aktarılıyor",
  [TransferStatus.COMPLETED]: "Tamamlandı",
  [TransferStatus.CANCELLED]: "İptal",
  [TransferStatus.FAILED]: "Başarısız",
};

const statusColor: Record<string, string> = {
  [TransferStatus.PENDING]: "#f39c12",
  [TransferStatus.IN_PROGRESS]: "#3498db",
  [TransferStatus.COMPLETED]: "#27ae60",
  [TransferStatus.CANCELLED]: "#95a5a6",
  [TransferStatus.FAILED]: "#e74c3c",
};

export default function TransfersScreen() {
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [receiverNodeId, setReceiverNodeId] = useState("");
  const [receiverPubKey, setReceiverPubKey] = useState("");
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
          style={styles.input}
          placeholder="Alıcı Node ID"
          value={receiverNodeId}
          onChangeText={setReceiverNodeId}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Alıcı Public Key (base64)"
          value={receiverPubKey}
          onChangeText={setReceiverPubKey}
          autoCapitalize="none"
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
        ListEmptyComponent={<Text style={styles.empty}>{isLoading ? "Yükleniyor..." : "Transfer yok"}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  sendSection: { backgroundColor: "#fff", borderRadius: 10, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  input: {
    borderWidth: 1, borderColor: "#ddd", borderRadius: 8,
    padding: 12, fontSize: 14, marginBottom: 8, backgroundColor: "#fafafa",
  },
  button: {
    backgroundColor: "#2c3e50", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 4,
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  card: {
    backgroundColor: "#fff", borderRadius: 10, padding: 14,
    marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  filename: { fontSize: 15, fontWeight: "500", flex: 1, marginRight: 8 },
  status: { fontSize: 13, fontWeight: "600" },
  meta: { fontSize: 12, color: "#888" },
  downloadBtn: { marginTop: 8, alignSelf: "flex-end" },
  downloadText: { color: "#2c3e50", fontWeight: "600", fontSize: 14 },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
});
