import { useState } from "react";
import { File, Paths } from "expo-file-system";
import { api } from "../../../api/client";
import { ecdh, deriveTransferKey, decryptAESGCM } from "../../../lib/crypto";
import { getOrCreateDeviceKeyPair } from "../../../lib/keyManager";
import { getStoredDeviceId } from "../../../lib/device";

interface DownloadState {
  downloading: boolean;
  progress: number;
  totalChunks: number;
  error: string | null;
}

export function useDownload() {
  const [state, setState] = useState<DownloadState>({
    downloading: false, progress: 0, totalChunks: 0, error: null,
  });

  const download = async (transferId: string, senderEphemeralPubBase64: string, filename: string) => {
    setState({ downloading: true, progress: 0, totalChunks: 0, error: null });

    try {
      const { privateKey, publicKey } = await getOrCreateDeviceKeyPair();
      const senderEphemeralPub = Buffer.from(senderEphemeralPubBase64, "base64");
      const sharedSecret = ecdh(privateKey, senderEphemeralPub);
      const aesKey = deriveTransferKey(sharedSecret, transferId, senderEphemeralPub, publicKey);

      const deviceId = await getStoredDeviceId();
      const response = await api.get(`/api/v1/chunks/${transferId}`, {
        params: { start_chunk: 0, receiver_node_id: deviceId },
        responseType: "text",
      });

      const lines = (response.data as string).split("\n").filter((l: string) => l.trim());
      setState((s) => ({ ...s, totalChunks: lines.length }));

      const decryptedChunks: Buffer[] = [];
      for (let i = 0; i < lines.length; i++) {
        const chunk = JSON.parse(lines[i]);
        const ciphertext = Buffer.from(chunk.data, "base64");
        const plaintext = decryptAESGCM(aesKey, ciphertext);
        decryptedChunks.push(plaintext);
        setState((s) => ({ ...s, progress: i + 1 }));
      }

      const fullFile = Buffer.concat(decryptedChunks);
      const outFile = new File(Paths.document, filename);
      const uint8 = new Uint8Array(fullFile.buffer, fullFile.byteOffset, fullFile.byteLength);
      const stream = outFile.writableStream();
      const writer = stream.getWriter();
      await writer.write(uint8);
      await writer.close();

      setState((s) => ({ ...s, downloading: false }));
      return outFile.uri;
    } catch (e: any) {
      setState({ downloading: false, progress: 0, totalChunks: 0, error: e?.message || "Download failed" });
      throw e;
    }
  };

  return { ...state, download };
}
