import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useFriends,
  useFriendRequests,
  useSearchUsers,
  useSendFriendRequest,
  useRespondToFriendRequest,
  useRemoveFriend,
} from "../../src/features/friends/hooks/useFriends";
import type { Friend, UserInfo } from "../../src/features/friends/types";
import { toast } from "../../src/lib/toast";
import { colors, spacing, radius } from "../../src/lib/theme";

type Tab = "friends" | "requests" | "search";

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("friends");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);

  const { data: friends = [], isLoading: friendsLoading, refetch: refetchFriends } = useFriends();
  const { data: requests = [], isLoading: requestsLoading, refetch: refetchRequests } = useFriendRequests();
  const searchMutation = useSearchUsers();
  const sendRequest = useSendFriendRequest();
  const respond = useRespondToFriendRequest();
  const remove = useRemoveFriend();

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    searchMutation.mutate(query.trim(), {
      onSuccess: (results) => setSearchResults(results),
      onError: () => toast.error("Search failed"),
    });
  }, [query]);

  const handleSendRequest = useCallback((userId: string) => {
    sendRequest.mutate(userId, {
      onSuccess: () => {
        toast.success("Friend request sent");
        setSearchResults((prev) => prev.filter((u) => u.user_id !== userId));
      },
      onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to send request"),
    });
  }, []);

  const handleRespond = useCallback((friendshipId: string, accept: boolean) => {
    respond.mutate(
      { friendshipId, accept },
      {
        onSuccess: () => {
          toast.success(accept ? "Request accepted" : "Request rejected");
        },
        onError: () => toast.error("Failed to respond"),
      }
    );
  }, []);

  const handleRemove = useCallback((friendshipId: string, username: string) => {
    Alert.alert("Remove Friend", `Remove ${username} from your friends?`, [
      { text: "Cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () =>
          remove.mutate(friendshipId, {
            onSuccess: () => toast.success("Friend removed"),
            onError: () => toast.error("Failed to remove"),
          }),
      },
    ]);
  }, []);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "friends", label: "Friends", count: friends.length },
    { key: "requests", label: "Requests", count: requests.length },
    { key: "search", label: "Search" },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Friends</Text>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
            {t.count !== undefined && t.count > 0 && (
              <View style={[styles.badge, tab === t.key && styles.badgeActive]}>
                <Text style={[styles.badgeText, tab === t.key && styles.badgeTextActive]}>
                  {t.count}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Friends List */}
      {tab === "friends" && (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.user.username.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.user.username}</Text>
                <Text style={styles.cardEmail}>{item.user.email}</Text>
              </View>
              <Pressable
                style={styles.removeBtn}
                onPress={() => handleRemove(item.id, item.user.username)}
              >
                <Ionicons name="person-remove-outline" size={16} color={colors.error} />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="people-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {friendsLoading ? "Loading..." : "No friends yet"}
              </Text>
              {!friendsLoading && (
                <Text style={styles.emptySub}>
                  Use the Search tab to find and add people
                </Text>
              )}
            </View>
          }
          onRefresh={() => refetchFriends()}
          refreshing={friendsLoading}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Requests */}
      {tab === "requests" && (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.user.username.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.user.username}</Text>
                <Text style={styles.cardEmail}>{item.user.email}</Text>
              </View>
              <View style={styles.requestActions}>
                <Pressable
                  style={styles.acceptBtn}
                  onPress={() => handleRespond(item.id, true)}
                >
                  <Ionicons name="checkmark" size={16} color={colors.success} />
                </Pressable>
                <Pressable
                  style={styles.rejectBtn}
                  onPress={() => handleRespond(item.id, false)}
                >
                  <Ionicons name="close" size={16} color={colors.error} />
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="checkmark-circle-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {requestsLoading ? "Loading..." : "No pending requests"}
              </Text>
            </View>
          }
          onRefresh={() => refetchRequests()}
          refreshing={requestsLoading}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Search */}
      {tab === "search" && (
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <Ionicons
                name="search"
                size={16}
                color={colors.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username..."
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoCapitalize="none"
              />
            </View>
            <Pressable
              style={[styles.searchBtn, (!query.trim() || searchMutation.isPending) && styles.disabled]}
              onPress={handleSearch}
              disabled={!query.trim() || searchMutation.isPending}
            >
              <Text style={styles.searchBtnText}>
                {searchMutation.isPending ? "..." : "Search"}
              </Text>
            </Pressable>
          </View>

          {searchMutation.isPending && (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
          )}

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.user_id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.username.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.username}</Text>
                  <Text style={styles.cardEmail}>{item.email}</Text>
                </View>
                <Pressable
                  style={styles.addBtn}
                  onPress={() => handleSendRequest(item.user_id)}
                  disabled={sendRequest.isPending}
                >
                  <Ionicons name="person-add-outline" size={14} color={colors.accent} />
                  <Text style={styles.addBtnText}>Add</Text>
                </Pressable>
              </View>
            )}
            ListEmptyComponent={
              searchResults.length === 0 && query && !searchMutation.isPending ? (
                <Text style={styles.noResults}>No users found for "{query}"</Text>
              ) : null
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.md },
  header: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.accentDim,
  },
  tabText: { fontSize: 13, fontWeight: "500", color: colors.textSecondary },
  tabTextActive: { color: colors.accent },
  badge: {
    backgroundColor: colors.inputBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  badgeActive: { backgroundColor: "rgba(124, 91, 245, 0.25)" },
  badgeText: { fontSize: 11, fontWeight: "600", color: colors.textMuted },
  badgeTextActive: { color: colors.accent },
  listContent: { paddingBottom: 120 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 14,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: "rgba(124, 91, 245, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 13, fontWeight: "700", color: colors.accent },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: "600", color: colors.text },
  cardEmail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  requestActions: { flexDirection: "row", gap: 8 },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(52,211,153,0.1)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: "rgba(124, 91, 245, 0.3)",
  },
  addBtnText: { fontSize: 12, fontWeight: "600", color: colors.accent },
  searchContainer: { flex: 1 },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: spacing.md },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
  },
  searchIcon: { marginLeft: 12 },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  searchBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  noResults: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 32,
  },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 8 },
  emptyTitle: { color: colors.textMuted, fontSize: 15, fontWeight: "500" },
  emptySub: { color: colors.textMuted, fontSize: 13 },
});
