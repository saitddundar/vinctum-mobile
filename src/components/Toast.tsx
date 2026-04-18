import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToast, ToastType } from "../lib/toast";
import { colors, radius, spacing } from "../lib/theme";

const typeColor: Record<ToastType, string> = {
  success: colors.success,
  error: colors.error,
  warning: colors.warning,
  info: colors.accent,
};

export function Toast() {
  const insets = useSafeAreaInsets();
  const { message, type, id, hide } = useToast();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, damping: 18, stiffness: 180, mass: 1, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
      setTimeout(hide, 240);
    }, 2800);
    return () => clearTimeout(t);
  }, [id]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrapper, { top: insets.top + spacing.sm }, { transform: [{ translateY }], opacity }]}
    >
      <Pressable onPress={hide} style={[styles.toast, { borderColor: typeColor[type] }]}>
        <View style={[styles.dot, { backgroundColor: typeColor[type] }]} />
        <Text style={styles.text} numberOfLines={3}>
          {message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
    elevation: 1000,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { color: colors.text, fontSize: 14, flex: 1, fontWeight: "500" },
});
