import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../api/client";
import { getStoredDeviceId } from "../../../lib/device";

export type PresenceInfo = {
  user_id: string;
  device_id: string;
  online: boolean;
  last_seen?: unknown;
};

export function usePresence(userIds: string[]) {
  const stableIds = useMemo(
    () => Array.from(new Set(userIds.filter(Boolean))).sort(),
    [userIds.join("|")]
  );

  return useQuery({
    queryKey: ["presence", stableIds],
    queryFn: async () => {
      const { data } = await api.post<{ presence: PresenceInfo[] }>(
        "/api/v1/presence/bulk",
        { user_ids: stableIds }
      );
      return new Map(
        (data.presence || []).map((item) => [item.user_id, item])
      );
    },
    enabled: stableIds.length > 0,
    refetchInterval: 30000,
  });
}

export function usePresenceHeartbeat(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    let stopped = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const beat = async () => {
      const deviceId = await getStoredDeviceId();
      if (!deviceId || stopped) return;
      try {
        await api.post("/api/v1/presence/heartbeat", { device_id: deviceId });
      } catch {}
    };

    beat();
    timer = setInterval(beat, 20000);

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };
  }, [enabled]);
}
