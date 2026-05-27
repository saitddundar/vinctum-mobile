import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../api/client";
import type { Friend, UserInfo, NotificationCount } from "../types";
import type { Device } from "../../devices/types";

export function useFriends() {
  return useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const { data } = await api.get<{ friends: Friend[] }>("/api/v1/friends");
      return data.friends || [];
    },
  });
}

export function useFriendRequests() {
  return useQuery({
    queryKey: ["friend-requests"],
    queryFn: async () => {
      const { data } = await api.get<{ requests: Friend[] }>("/api/v1/friends/requests");
      return data.requests || [];
    },
  });
}

export function useSearchUsers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (query: string) => {
      const { data } = await api.get<{ users: UserInfo[] }>(
        `/api/v1/users/search?q=${encodeURIComponent(query)}`
      );
      return data.users || [];
    },
  });
}

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (addresseeUserId: string) => {
      const { data } = await api.post("/api/v1/friends/request", {
        addressee_user_id: addresseeUserId,
      });
      return data.friendship;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });
}

export function useRespondToFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ friendshipId, accept }: { friendshipId: string; accept: boolean }) => {
      const { data } = await api.post("/api/v1/friends/respond", {
        friendship_id: friendshipId,
        accept,
      });
      return data.friendship;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["friend-requests"] });
      qc.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });
}

export function useRemoveFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      await api.delete(`/api/v1/friends/${friendshipId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

export function useNotificationCount() {
  return useQuery({
    queryKey: ["notification-count"],
    queryFn: async () => {
      const { data } = await api.get<NotificationCount>("/api/v1/notifications/count");
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useFriendDevices(userId: string | null) {
  return useQuery({
    queryKey: ["friend-devices", userId],
    queryFn: async () => {
      const { data } = await api.get<{ devices: Device[] }>(
        `/api/v1/friends/${userId}/devices`
      );
      return data.devices || [];
    },
    enabled: !!userId,
  });
}

export function useRespondToTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      transferId,
      receiverNodeId,
      accept,
    }: {
      transferId: string;
      receiverNodeId: string;
      accept: boolean;
    }) => {
      await api.post(`/api/v1/transfers/${transferId}/respond`, {
        receiver_node_id: receiverNodeId,
        accept,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      qc.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });
}
