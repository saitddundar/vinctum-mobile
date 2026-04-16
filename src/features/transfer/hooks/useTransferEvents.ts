import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../../../api/client";
import { TransferEvent } from "../types";

interface Options {
  enabled?: boolean;
  onEvent?: (event: TransferEvent) => void;
}

export function useTransferEvents(nodeId: string | null, opts: Options = {}) {
  const { enabled = true, onEvent } = opts;
  const qc = useQueryClient();
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!nodeId || !enabled) return;
    cancelledRef.current = false;
    let attempt = 0;

    const connect = async () => {
      const token = await SecureStore.getItemAsync("access_token");
      if (cancelledRef.current) return;

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      let lastIndex = 0;

      xhr.open("GET", `${API_BASE_URL}/api/v1/transfer-events?node_id=${encodeURIComponent(nodeId)}`);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("Accept", "application/x-ndjson");

      xhr.onreadystatechange = () => {
        if (xhr.readyState < 3) return;
        const buffer = xhr.responseText;
        if (lastIndex >= buffer.length) return;

        const newChunk = buffer.slice(lastIndex);
        const lines = newChunk.split("\n");
        // last segment may be partial; only consume complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          try {
            const evt = JSON.parse(line) as TransferEvent;
            onEvent?.(evt);
            qc.invalidateQueries({ queryKey: ["transfers", nodeId] });
            if (evt.transfer?.transfer_id) {
              qc.invalidateQueries({ queryKey: ["transfer", evt.transfer.transfer_id] });
            }
          } catch {
            // ignore malformed line
          }
        }
        lastIndex += newChunk.length - lines[lines.length - 1].length;
      };

      const scheduleReconnect = () => {
        if (cancelledRef.current) return;
        attempt += 1;
        const delay = Math.min(30000, 1000 * 2 ** Math.min(attempt, 5));
        reconnectRef.current = setTimeout(connect, delay);
      };

      xhr.onerror = scheduleReconnect;
      xhr.onload = () => {
        // server closed stream — try reconnect
        scheduleReconnect();
      };

      xhr.send();
    };

    connect();

    return () => {
      cancelledRef.current = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (xhrRef.current) {
        try { xhrRef.current.abort(); } catch {}
      }
    };
  }, [nodeId, enabled, qc, onEvent]);
}
