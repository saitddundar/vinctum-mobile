import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFiles, LocalFile } from "../../src/features/files/useFiles";
import { colors, spacing, radius } from "../../src/lib/theme";
import { toast } from "../../src/lib/toast";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getFileIcon(name: string): "image-outline" | "document-text-outline" | "videocam-outline" | "document-outline" {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return "document-outline";
  
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image-outline";
  if (["txt", "md", "csv", "json", "pdf"].includes(ext)) return "document-text-outline";
  if (["mp4", "mov", "avi"].includes(ext)) return "videocam-outline";
  return "document-outline";
}

export default function FilesScreen() {
  const insets = useSafeAreaInsets();
  const { files, loading, refresh, deleteFile, shareFile } = useFiles();

  const handleDelete = useCallback((file: LocalFile) => {
    Alert.alert("Delete File", `Are you sure you want to delete ${file.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const success = await deleteFile(file.uri);
          if (success) {
            toast.success("File deleted");
          } else {
            toast.error("Failed to delete file");
          }
        },
      },
    ]);
  }, [deleteFile]);

  const renderItem = ({ item }: { item: LocalFile }) => (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={getFileIcon(item.name)} size={24} color={colors.accent} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.meta}>
          {formatSize(item.size)} • {new Date(item.modificationTime * 1000).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={() => shareFile(item.uri)}>
          <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Files</Text>
      <FlatList
        data={files}
        keyExtractor={(item) => item.uri}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No files found</Text>
              <Text style={styles.emptySub}>Downloaded files will appear here</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
  },
  header: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: 120,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: 8,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
