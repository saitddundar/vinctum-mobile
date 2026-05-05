import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { api } from "../../../api/client";
import { readFileAsBuffer, splitIntoChunks, encryptChunks, DEFAULT_CHUNK_SIZE } from "../../../lib/chunker";
import {
  generateX25519KeyPair,
  generateFileKey,
  ecdh,
  deriveWrapKey,
  wrapFileKey,
  sha256,
  encryptAESGCM,
} from "../../../lib/crypto";
import { getStoredDeviceId } from "../../../lib/device";
import { validateFileSize } from "../../../lib/validation";
import type { InitiateGroupTransferResponse, RecipientKey } from "../types";

interface SessionTransferState {
  uploading: boolean;
  progress: number;
  totalChunks: number;
  error: string | null;
}

interface DeviceKeyInfo {
  device_id: string;
  node_id: string;
  kex_public_key: string; // base64
}

export function useSessionTransfer() {
  const [state, setState] = useState<SessionTransferState>({
    uploading: false, progress: 0, totalChunks: 0, error: null,
  });

  const upload = async (sessionId: string, recipients: DeviceKeyInfo[]) => {
    if (recipients.length === 0) throw new Error("No recipients");

    setState({ uploading: true, progress: 0, totalChunks: 0, error: null });

    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
      if (result.canceled) {
        setState((s) => ({ ...s, uploading: false }));
        return;
      }

      const file = result.assets[0];
      const sizeErr = validateFileSize(file.size ?? 0);
      if (sizeErr) throw new Error(sizeErr);

      const fileBuffer = await readFileAsBuffer(file.uri);
      const contentHash = sha256(fileBuffer);
      const rawChunks = splitIntoChunks(fileBuffer, DEFAULT_CHUNK_SIZE);

      // Generate one ephemeral key pair and one random file key
      const ephemeral = generateX25519KeyPair();
      const fileKey = generateFileKey();

      // Wrap file key for each recipient
      const recipientKeys: RecipientKey[] = recipients.map((r) => {
        const receiverPub = Buffer.from(r.kex_public_key, "base64");
        const sharedSecret = ecdh(ephemeral.privateKey, receiverPub);
        const wrapKey = deriveWrapKey(sharedSecret, ephemeral.publicKey, receiverPub);
        const wrapped = wrapFileKey(fileKey, wrapKey);
        return {
          receiver_node_id: r.node_id,
          wrapped_file_key: wrapped.toString("base64"),
        };
      });

      // Initiate group transfer
      const deviceId = await getStoredDeviceId();
      const { data: initData } = await api.post<InitiateGroupTransferResponse>(
        `/api/v1/sessions/${sessionId}/transfer`,
        {
          sender_node_id: deviceId,
          filename: file.name,
          total_size_bytes: file.size,
          content_hash: contentHash,
          chunk_size_bytes: DEFAULT_CHUNK_SIZE,
          sender_ephemeral_pubkey: ephemeral.publicKey.toString("base64"),
          recipient_keys: recipientKeys,
        }
      );

      const groupId = initData.group_transfer_id;

      // Encrypt chunks with file key and upload once
      const encrypted = encryptChunks(rawChunks, fileKey);
      setState((s) => ({ ...s, totalChunks: encrypted.length }));

      for (const chunk of encrypted) {
        const formData = new FormData();
        formData.append("chunk_index", chunk.index.toString());
        formData.append("chunk_hash", chunk.hash);
        const ab = chunk.data.buffer.slice(
          chunk.data.byteOffset,
          chunk.data.byteOffset + chunk.data.byteLength
        ) as ArrayBuffer;
        formData.append("data", new Blob([ab]), `chunk_${chunk.index}`);

        await api.post(`/api/v1/chunks/${groupId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setState((s) => ({ ...s, progress: chunk.index + 1 }));
      }

      setState((s) => ({ ...s, uploading: false }));
      return groupId;
    } catch (e: any) {
      setState({ uploading: false, progress: 0, totalChunks: 0, error: e?.message || "Upload failed" });
      throw e;
    }
  };

  return { ...state, upload };
}
