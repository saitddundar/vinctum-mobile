import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBiometricStore } from "../store/biometric";
import { colors, spacing, radius } from "../lib/theme";

export function LockScreen() {
  const { isLocked, unlock } = useBiometricStore();

  if (!isLocked) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={48} color={colors.accent} />
        </View>
        <Text style={styles.title}>Vinctum is Locked</Text>
        <Text style={styles.subtitle}>Authenticate to continue</Text>
        <Pressable style={styles.button} onPress={unlock}>
          <Ionicons name="scan-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Unlock with Face ID</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
