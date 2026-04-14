import { File, Paths } from "expo-file-system";
import { encryptAESGCM, sha256 } from "./crypto";

export const DEFAULT_CHUNK_SIZE = 256 * 1024; // 256 KB

export interface Chunk {
  index: number;
  data: Buffer;
  hash: string;
}

export async function readFileAsBuffer(uri: string): Promise<Buffer> {
  const file = new File(uri);
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export function splitIntoChunks(data: Buffer, chunkSize: number = DEFAULT_CHUNK_SIZE): Buffer[] {
  const chunks: Buffer[] = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.subarray(i, Math.min(i + chunkSize, data.length)));
  }
  return chunks;
}

export function encryptChunks(chunks: Buffer[], key: Buffer): Chunk[] {
  return chunks.map((chunk, index) => {
    const encrypted = encryptAESGCM(key, chunk);
    return {
      index,
      data: encrypted,
      hash: sha256(encrypted),
    };
  });
}
