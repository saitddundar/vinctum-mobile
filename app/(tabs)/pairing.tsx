import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { useGeneratePairingCode, useRedeemPairingCode } from "../../src/features/devices/hooks/usePairing";
import { getStoredDeviceId } from "../../src/lib/device";
import { DeviceType } from "../../src/features/devices/types";
import { colors, spacing, radius } from "../../src/lib/theme";

export default function PairingScreen() {
  const [tab, setTab] = useState<"generate" | "redeem">("generate");

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === "generate" && styles.activeTab]}
          onPress={() => setTab("generate")}
        >
          <Text style={[styles.tabText, tab === "generate" && styles.activeTabText]}>Kod Üret</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "redeem" && styles.activeTab]}
          onPress={() => setTab("redeem")}
        >
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
      <Pressable
        style={[styles.button, generate.isPending && styles.disabled]}
        onPress={handleGenerate}
        disabled={generate.isPending}
      >
        <Text style={styles.buttonText}>{generate.isPending ? "Üretiliyor..." : "Kod Üret"}</Text>
      </Pressable>
      {code && (
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Eşleştirme Kodu</Text>
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
  const [inputFocused, setInputFocused] = useState<string | null>(null);
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
        onSuccess: () => Alert.alert("Başarılı", "Eşleştirme isteği gönderildi. Onay bekleniyor."),
        onError: (e: any) => Alert.alert("Hata", e?.response?.data?.error || "Kod geçersiz"),
      }
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.desc}>Başka bir cihazdan aldığın kodu gir.</Text>
      <TextInput
        style={[styles.input, inputFocused === "code" && styles.inputFocused]}
        placeholder="Eşleştirme kodu"
        placeholderTextColor={colors.textMuted}
        value={pairingCode}
        onChangeText={setPairingCode}
        autoCapitalize="characters"
        onFocus={() => setInputFocused("code")}
        onBlur={() => setInputFocused(null)}
      />
      <TextInput
        style={[styles.input, inputFocused === "name" && styles.inputFocused]}
        placeholder="Bu cihazın adı"
        placeholderTextColor={colors.textMuted}
        value={deviceName}
        onChangeText={setDeviceName}
        onFocus={() => setInputFocused("name")}
        onBlur={() => setInputFocused(null)}
      />
      <Pressable
        style={[styles.button, redeem.isPending && styles.disabled]}
        onPress={handleRedeem}
        disabled={redeem.isPending}
      >
        <Text style={styles.buttonText}>{redeem.isPending ? "Gönderiliyor..." : "Eşleştir"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radius.sm },
  activeTab: { backgroundColor: colors.accent },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  activeTabText: { color: "#fff" },
  section: { flex: 1 },
  desc: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 20 },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 16,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  inputFocused: { borderColor: colors.inputBorderFocus },
  button: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  codeBox: {
    marginTop: spacing.xl,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.xl,
    borderRadius: radius.xl,
  },
  codeLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  code: { fontSize: 36, fontWeight: "bold", letterSpacing: 6, color: colors.accent },
  expires: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },
});
