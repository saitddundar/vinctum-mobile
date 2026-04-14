import { useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, TextInput, StyleSheet, Alert } from "react-native";
import { useSessions, useCreateSession, useCloseSession, useJoinSession, useLeaveSession } from "../../src/features/sessions/hooks/useSessions";
import { Session } from "../../src/features/sessions/types";
import { getStoredDeviceId } from "../../src/lib/device";

export default function SessionsScreen() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const { data: sessions, isLoading, refetch } = useSessions();
  const create = useCreateSession();
  const close = useCloseSession();
  const join = useJoinSession();
  const leave = useLeaveSession();

  useEffect(() => {
    getStoredDeviceId().then(setDeviceId);
  }, []);

  const handleCreate = () => {
    if (!sessionName || !deviceId) return;
    create.mutate({ name: sessionName, deviceId }, {
      onSuccess: () => {
        setSessionName("");
        setShowCreate(false);
      },
      onError: (e: any) => Alert.alert("Hata", e?.response?.data?.error || "Oluşturulamadı"),
    });
  };

  const handleClose = (id: string) => {
    Alert.alert("Oturumu Kapat", "Bu oturumu kapatmak istediğine emin misin?", [
      { text: "İptal" },
      { text: "Kapat", style: "destructive", onPress: () => close.mutate(id) },
    ]);
  };

  const handleJoin = (sessionId: string) => {
    if (!deviceId) return;
    join.mutate({ sessionId, deviceId }, {
      onError: (e: any) => Alert.alert("Hata", e?.response?.data?.error || "Katılınamadı"),
    });
  };

  const handleLeave = (sessionId: string) => {
    if (!deviceId) return;
    leave.mutate({ sessionId, deviceId }, {
      onError: (e: any) => Alert.alert("Hata", e?.response?.data?.error || "Ayrılınamadı"),
    });
  };

  const isInSession = (s: Session) =>
    s.devices?.some((d) => d.device_id === deviceId);

  return (
    <View style={styles.container}>
      <Pressable style={styles.createBtn} onPress={() => setShowCreate(!showCreate)}>
        <Text style={styles.createBtnText}>{showCreate ? "İptal" : "+ Yeni Oturum"}</Text>
      </Pressable>

      {showCreate && (
        <View style={styles.createSection}>
          <TextInput
            style={styles.input}
            placeholder="Oturum adı"
            value={sessionName}
            onChangeText={setSessionName}
          />
          <Pressable style={[styles.button, create.isPending && styles.disabled]} onPress={handleCreate} disabled={create.isPending}>
            <Text style={styles.buttonText}>{create.isPending ? "Oluşturuluyor..." : "Oluştur"}</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={sessions}
        keyExtractor={(s) => s.session_id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.sessionName}>{item.name}</Text>
              <Text style={[styles.badge, item.is_active ? styles.active : styles.closed]}>
                {item.is_active ? "Aktif" : "Kapalı"}
              </Text>
            </View>
            <Text style={styles.meta}>
              {item.devices?.length || 0} cihaz • {new Date(item.created_at).toLocaleDateString("tr")}
            </Text>

            {item.is_active && (
              <View style={styles.actions}>
                {isInSession(item) ? (
                  <>
                    <Pressable style={styles.actionBtn} onPress={() => handleLeave(item.session_id)}>
                      <Text style={styles.leaveText}>Ayrıl</Text>
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={() => handleClose(item.session_id)}>
                      <Text style={styles.closeText}>Kapat</Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable style={styles.actionBtn} onPress={() => handleJoin(item.session_id)}>
                    <Text style={styles.joinText}>Katıl</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{isLoading ? "Yükleniyor..." : "Oturum yok"}</Text>}
        onRefresh={refetch}
        refreshing={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  createBtn: { alignSelf: "flex-end", marginBottom: 12 },
  createBtnText: { color: "#2c3e50", fontSize: 15, fontWeight: "600" },
  createSection: { backgroundColor: "#fff", borderRadius: 10, padding: 16, marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: "#ddd", borderRadius: 8,
    padding: 12, fontSize: 14, marginBottom: 8, backgroundColor: "#fafafa",
  },
  button: { backgroundColor: "#2c3e50", padding: 14, borderRadius: 8, alignItems: "center" },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  card: {
    backgroundColor: "#fff", borderRadius: 10, padding: 14,
    marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  sessionName: { fontSize: 16, fontWeight: "600", flex: 1 },
  badge: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, overflow: "hidden" },
  active: { backgroundColor: "#d4edda", color: "#155724" },
  closed: { backgroundColor: "#f8d7da", color: "#721c24" },
  meta: { fontSize: 13, color: "#888", marginBottom: 8 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 16 },
  actionBtn: { paddingVertical: 4 },
  joinText: { color: "#2c3e50", fontWeight: "600", fontSize: 14 },
  leaveText: { color: "#f39c12", fontWeight: "600", fontSize: 14 },
  closeText: { color: "#e74c3c", fontWeight: "600", fontSize: 14 },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
});
