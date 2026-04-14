import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { api } from "../../../api/client";
import { readFileAsBuffer, splitIntoChunks, encryptChunks, DEFAULT_CHUNK_SIZE } from "../../../lib/chunker";
import { generateX25519KeyPair, ecdh, deriveTransferKey, sha256 } from "../../../lib/crypto";
import { getStoredDeviceId } from "../../../lib/device";

interface UploadState {
  uploading: boolean;
  progress: number;
  totalChunks: number;
  error: string | null;
}

export function useUpload() {
  const [state, setState] = useState<UploadState>({
    uploading: false, progress: 0, totalChunks: 0, error: null,
  });

  const upload = async (receiverNodeId: string, receiverPubKeyBase64: string) => {
    setState({ uploading: true, progress: 0, totalChunks: 0, error: null });

    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
      if (result.canceled) {
        setState((s) => ({ ...s, uploading: false }));
        return;
      }

      const file = result.assets[0];
      const fileBuffer = await readFileAsBuffer(file.uri);
      const contentHash = sha256(fileBuffer);
      const rawChunks = splitIntoChunks(fileBuffer, DEFAULT_CHUNK_SIZE);

      // E2E key derivation: ephemeral X25519 + receiver static pubkey
      const ephemeral = generateX25519KeyPair();
      const receiverPub = Buffer.from(receiverPubKeyBase64, "base64");
      const sharedSecret = ecdh(ephemeral.privateKey, receiverPub);

      // initiate transfer to get transfer_id
      const deviceId = await getStoredDeviceId();
      const { data: initData } = await api.post("/api/v1/transfers", {
        sender_node_id: deviceId,
        receiver_node_id: receiverNodeId,
        filename: file.name,
        total_size_bytes: file.size,
        content_hash: contentHash,
        chunk_size_bytes: DEFAULT_CHUNK_SIZE,
        replication_factor: 1,
        sender_ephemeral_pubkey: ephemeral.publicKey.toString("base64"),
      });

      const transferId = initData.transfer_id;
      const aesKey = deriveTransferKey(sharedSecret, transferId, ephemeral.publicKey, receiverPub);

      const encrypted = encryptChunks(rawChunks, aesKey);
      setState((s) => ({ ...s, totalChunks: encrypted.length }));

      for (const chunk of encrypted) {
        const formData = new FormData();
        formData.append("chunk_index", chunk.index.toString());
        formData.append("chunk_hash", chunk.hash);
        const ab = chunk.data.buffer.slice(chunk.data.byteOffset, chunk.data.byteOffset + chunk.data.byteLength) as ArrayBuffer;
        formData.append("data", new Blob([ab]), `chunk_${chunk.index}`);

        await api.post(`/api/v1/chunks/${transferId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setState((s) => ({ ...s, progress: chunk.index + 1 }));
      }

      setState((s) => ({ ...s, uploading: false }));
      return transferId;
    } catch (e: any) {
      setState({ uploading: false, progress: 0, totalChunks: 0, error: e?.message || "Upload failed" });
      throw e;
    }
  };

  return { ...state, upload };
}
