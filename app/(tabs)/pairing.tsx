import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { useGeneratePairingCode, useRedeemPairingCode, useApprovePairing } from "../../src/features/devices/hooks/usePairing";
import { getStoredDeviceId } from "../../src/lib/device";
import { DeviceType } from "../../src/features/devices/types";

export default function PairingScreen() {
  const [tab, setTab] = useState<"generate" | "redeem">("generate");

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === "generate" && styles.activeTab]} onPress={() => setTab("generate")}>
          <Text style={[styles.tabText, tab === "generate" && styles.activeTabText]}>Kod Üret</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "redeem" && styles.activeTab]} onPress={() => setTab("redeem")}>
          <Text style={[styles.tabText, tab === "redeem" && styles.activeTabText]}>Kod Gir</Text>
        </Pressable>
      </View>

      {tab === "generate" ? <GenerateTab /> : <RedeemTab />}
    </View>
  );
}

function GenerateTab() {
  const [code, setCode] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState(0);
  const generate = useGeneratePairingCode();

  const handleGenerate = async () => {
    const deviceId = await getStoredDeviceId();
    if (!deviceId) {
      Alert.alert("Hata", "Önce cihaz kaydı yapılmalı");
      return;
    }
    generate.mutate({ device_id: deviceId }, {
      onSuccess: (data) => {
        setCode(data.pairing_code);
        setExpiresIn(data.expires_in_s);
      },
      onError: (e: any) => Alert.alert("Hata", e?.response?.data?.error || "Kod üretilemedi"),
    });
  };

  return (
    <View style={styles.section}>
      <Text style={styles.desc}>Yeni bir cihazı eşleştirmek için kod üret ve o cihazda gir.</Text>
      <Pressable style={styles.button} onPress={handleGenerate} disabled={generate.isPending}>
        <Text style={styles.buttonText}>{generate.isPending ? "Üretiliyor..." : "Kod Üret"}</Text>
      </Pressable>
      {code && (
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Eşleştirme Kodu:</Text>
          <Text style={styles.code}>{code}</Text>
          <Text style={styles.expires}>{Math.floor(expiresIn / 60)} dakika geçerli</Text>
        </View>
      )}
    </View>
  );
}

function RedeemTab() {
  const [pairingCode, setPairingCode] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const redeem = useRedeemPairingCode();

  const handleRedeem = () => {
    if (!pairingCode || !deviceName) return;
    redeem.mutate(
      {
        pairing_code: pairingCode,
        name: deviceName,
        device_type: DeviceType.PHONE,
        fingerprint: `mobile-${Date.now()}`,
        node_id: `node-${Date.now()}`,
      },
      {
        onSuccess: () => Alert.alert("Başarılı", "Cihaz eşleştirme isteği gönderildi. Onay bekleniyor."),
        onError: (e: any) => Alert.alert("Hata", e?.response?.data?.error || "Kod geçersiz"),
      }
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.desc}>Başka bir cihazdan aldığın kodu gir.</Text>
      <TextInput
        style={styles.input}
        placeholder="Eşleştirme kodu"
        value={pairingCode}
        onChangeText={setPairingCode}
        autoCapitalize="characters"
      />
      <TextInput
        style={styles.input}
        placeholder="Bu cihazın adı"
        value={deviceName}
        onChangeText={setDeviceName}
      />
      <Pressable style={[styles.button, redeem.isPending && styles.disabled]} onPress={handleRedeem} disabled={redeem.isPending}>
        <Text style={styles.buttonText}>{redeem.isPending ? "Gönderiliyor..." : "Eşleştir"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  tabs: { flexDirection: "row", marginBottom: 20, backgroundColor: "#e0e0e0", borderRadius: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  activeTab: { backgroundColor: "#2c3e50" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#666" },
  activeTabText: { color: "#fff" },
  section: { flex: 1 },
  desc: { fontSize: 14, color: "#666", marginBottom: 16, lineHeight: 20 },
  input: {
    borderWidth: 1, borderColor: "#ddd", borderRadius: 8,
    padding: 14, fontSize: 16, marginBottom: 12, backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#2c3e50", padding: 16, borderRadius: 8, alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  codeBox: { marginTop: 24, alignItems: "center", backgroundColor: "#fff", padding: 24, borderRadius: 12 },
  codeLabel: { fontSize: 14, color: "#666", marginBottom: 8 },
  code: { fontSize: 32, fontWeight: "bold", letterSpacing: 4, color: "#2c3e50" },
  expires: { fontSize: 12, color: "#999", marginTop: 8 },
});
