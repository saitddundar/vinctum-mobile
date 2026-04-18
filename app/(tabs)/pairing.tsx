import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useGeneratePairingCode, useRedeemPairingCode } from "../../src/features/devices/hooks/usePairing";
import { getStoredDeviceId } from "../../src/lib/device";
import { DeviceType } from "../../src/features/devices/types";
import { toast } from "../../src/lib/toast";
import { colors, spacing, radius } from "../../src/lib/theme";

export default function PairingScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"generate" | "redeem">("generate");

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Pair Device</Text>

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === "generate" && styles.activeTab]} onPress={() => setTab("generate")}>
          <Ionicons name="qr-code-outline" size={16} color={tab === "generate" ? "#fff" : colors.textSecondary} />
          <Text style={[styles.tabText, tab === "generate" && styles.activeTabText]}>Generate</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "redeem" && styles.activeTab]} onPress={() => setTab("redeem")}>
          <Ionicons name="key-outline" size={16} color={tab === "redeem" ? "#fff" : colors.textSecondary} />
          <Text style={[styles.tabText, tab === "redeem" && styles.activeTabText]}>Enter Code</Text>
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
      toast.error("Device must be registered first");
      return;
    }
    generate.mutate({ device_id: deviceId }, {
      onSuccess: (data) => {
        setCode(data.pairing_code);
        setExpiresIn(data.expires_in_s);
      },
      onError: (e: any) => toast.error(e?.response?.data?.error || "Could not generate code"),
    });
  };

  return (
    <View style={styles.section}>
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.desc}>Generate a code and enter it on the device you want to pair.</Text>
      </View>

      <Pressable
        style={[styles.button, generate.isPending && styles.disabled]}
        onPress={handleGenerate}
        disabled={generate.isPending}
      >
        <Ionicons name="refresh-outline" size={18} color="#fff" />
        <Text style={styles.buttonText}>{generate.isPending ? "Generating..." : "Generate Code"}</Text>
      </Pressable>

      {code && (
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Pairing Code</Text>
          <Text style={styles.code}>{code}</Text>
          <View style={styles.expiryRow}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.expires}>Valid for {Math.floor(expiresIn / 60)} min</Text>
          </View>
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
        onSuccess: () => {
          toast.success("Pairing request sent. Awaiting approval.");
          setPairingCode("");
          setDeviceName("");
        },
        onError: (e: any) => toast.error(e?.response?.data?.error || "Invalid code"),
      }
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.desc}>Enter the 6-character code shown on the other device.</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Pairing code"
        placeholderTextColor={colors.textMuted}
        value={pairingCode}
        onChangeText={setPairingCode}
        autoCapitalize="characters"
        maxLength={6}
      />
      <TextInput
        style={styles.input}
        placeholder="Name for this device"
        placeholderTextColor={colors.textMuted}
        value={deviceName}
        onChangeText={setDeviceName}
      />
      <Pressable
        style={[styles.button, (!pairingCode || !deviceName || redeem.isPending) && styles.disabled]}
        onPress={handleRedeem}
        disabled={!pairingCode || !deviceName || redeem.isPending}
      >
        <Ionicons name="link-outline" size={18} color="#fff" />
        <Text style={styles.buttonText}>{redeem.isPending ? "Sending..." : "Pair Device"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.md },
  header: { fontSize: 28, fontWeight: "800", color: colors.text, marginBottom: spacing.md, marginTop: spacing.sm, letterSpacing: -0.5 },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  activeTab: { backgroundColor: colors.accent },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  activeTabText: { color: "#fff" },
  section: { flex: 1 },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  desc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, flex: 1 },
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
  button: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radius.md,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
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
  codeLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
  code: { fontSize: 40, fontWeight: "800", letterSpacing: 8, color: colors.accent },
  expiryRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 12 },
  expires: { fontSize: 12, color: colors.textSecondary },
});
