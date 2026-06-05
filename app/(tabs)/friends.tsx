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
  SectionList,
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
import { usePresence } from "../../src/features/friends/hooks/usePresence";
import type { Friend, UserInfo } from "../../src/features/friends/types";
import { toast } from "../../src/lib/toast";
import { colors, spacing, radius } from "../../src/lib/theme";

function Avatar({
  name,
  size = 40,
  color = colors.accent,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return (
    <View
      style={[
        avatarStyles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color + "20",
          borderColor: color + "40",
        },
      ]}
    >
      <Text style={[avatarStyles.text, { color, fontSize: size * 0.36 }]}>
        {name[0]?.toUpperCase()}
      </Text>
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  text: { fontWeight: "700" },
});

const AVATAR_COLORS = [
  colors.accent,
  colors.blue,
  colors.purple,
  colors.warning,
  colors.orange,
];

function getColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);

  const {
    data: friends = [],
    isLoading: friendsLoading,
    refetch: refetchFriends,
  } = useFriends();
  const {
    data: requests = [],
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = useFriendRequests();
  const searchMutation = useSearchUsers();
  const sendRequest = useSendFriendRequest();
  const respond = useRespondToFriendRequest();
  const remove = useRemoveFriend();
  const friendUserIds = friends.map((friend) => friend.user.user_id);
  const { data: presence = new Map() } = usePresence(friendUserIds);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    searchMutation.mutate(query.trim(), {
      onSuccess: (results) => setSearchResults(results),
      onError: () => {
        setSearchResults([]);
        toast.error("Search failed");
      },
    });
  }, [query]);

  const handleSendRequest = useCallback((userId: string) => {
    sendRequest.mutate(userId, {
      onSuccess: () => {
        toast.success("Friend request sent");
        setSearchResults((prev) => prev.filter((u) => u.user_id !== userId));
      },
      onError: (e: any) =>
        toast.error(e?.response?.data?.error || "Failed to send request"),
    });
  }, []);

  const handleRespond = useCallback((friendshipId: string, accept: boolean) => {
    respond.mutate(
      { friendshipId, accept },
      {
        onSuccess: () => {
          toast.success(accept ? "Request accepted" : "Request rejected");
          refetchFriends();
          refetchRequests();
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Text style={styles.header}>Friends</Text>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={15} color={colors.textMuted} style={{ marginLeft: 12 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {searchMutation.isPending && (
          <ActivityIndicator
            size="small"
            color={colors.accent}
            style={{ marginRight: 12 }}
          />
        )}
      </View>

      {/* Search results */}
      {searchResults.length > 0 && (
        <View style={styles.searchResultsBox}>
          {searchResults.map((item) => (
            <View key={item.user_id} style={styles.resultRow}>
              <Avatar name={item.username} color={getColor(item.username)} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.username}</Text>
                <Text style={styles.cardHandle}>@{item.username}</Text>
              </View>
              <Pressable
                style={styles.addBtn}
                onPress={() => handleSendRequest(item.user_id)}
                disabled={sendRequest.isPending}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        onRefresh={() => {
          refetchFriends();
          refetchRequests();
        }}
        refreshing={friendsLoading || requestsLoading}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <>
            {/* Requests section */}
            {requests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  REQUESTS · {requests.length}
                </Text>
                {requests.map((item) => (
                  <View key={item.id} style={styles.card}>
                    <Avatar
                      name={item.user.username}
                      color={getColor(item.user.username)}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardName}>{item.user.username}</Text>
                      <Text style={styles.cardHandle}>
                        @{item.user.username}
                      </Text>

                    </View>
                    <View style={styles.requestActions}>
                      <Pressable
                        style={styles.acceptIconBtn}
                        onPress={() => handleRespond(item.id, true)}
                      >
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={colors.bg}
                        />
                      </Pressable>
                      <Pressable
                        style={styles.rejectIconBtn}
                        onPress={() => handleRespond(item.id, false)}
                      >
                        <Ionicons
                          name="close"
                          size={16}
                          color={colors.textSecondary}
                        />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Friends section header */}
            {friends.length > 0 && (
              <Text style={styles.sectionLabel}>
                ALL FRIENDS · {friends.length}
              </Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Avatar
              name={item.user.username}
              color={getColor(item.user.username)}
            />
            <View style={styles.friendOnlineDotWrap}>
              <View
                style={[
                  styles.friendOnlineDot,
                  presence.get(item.user.user_id)?.online && styles.friendOnlineDotActive,
                ]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{item.user.username}</Text>
              <Text style={styles.cardHandle}>@{item.user.username}</Text>
            </View>
            <Pressable style={styles.messageBtn} onPress={() => toast.info("Messaging coming soon")}>
              <Text style={styles.messageBtnText}>Message</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          !friendsLoading ? (
            <View style={styles.emptyWrap}>
              <Ionicons
                name="people-outline"
                size={36}
                color={colors.textMuted}
              />
              <Text style={styles.emptyText}>No friends yet</Text>
              <Text style={styles.emptySubText}>
                Search above to find people
              </Text>
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
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  searchResultsBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  addBtnText: { fontSize: 13, fontWeight: "600", color: colors.accent },
  section: { marginBottom: spacing.md },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 14,
    marginBottom: 8,
    position: "relative",
  },
  friendOnlineDotWrap: {
    position: "absolute",
    left: 42,
    top: 38,
  },
  friendOnlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.textMuted,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  friendOnlineDotActive: {
    backgroundColor: colors.success,
  },
  cardName: { fontSize: 14, fontWeight: "600", color: colors.text },
  cardHandle: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  mutualText: {
    fontSize: 11,
    color: colors.accent,
    marginTop: 3,
    fontWeight: "500",
  },
  requestActions: { flexDirection: "row", gap: 8 },
  acceptIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  messageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  messageBtnText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  emptyWrap: {
    alignItems: "center",
    marginTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textMuted,
  },
  emptySubText: { fontSize: 13, color: colors.textMuted },
});
