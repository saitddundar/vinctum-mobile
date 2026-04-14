import { View, Text, StyleSheet, Pressable } from "react-native";
import { useAuthStore } from "../../src/store/auth";

export default function HomeScreen() {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vinctum</Text>
      {user && <Text style={styles.subtitle}>Hoşgeldin, {user.username}</Text>}
      <Pressable style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Çıkış Yap</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 24 },
  button: { backgroundColor: "#e74c3c", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: "#fff", fontWeight: "600" },
});
