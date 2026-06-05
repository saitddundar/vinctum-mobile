import { useState, useCallback, useEffect } from "react";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export type LocalFile = {
  name: string;
  uri: string;
  size: number;
  modificationTime: number;
  isDirectory: boolean;
};

export function useFiles() {
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const dirUri = FileSystem.documentDirectory;
      if (!dirUri) return;
      const entries = await FileSystem.readDirectoryAsync(dirUri);
      
      const fileInfos = await Promise.all(
        entries.map(async (name) => {
          const uri = dirUri + name;
          const info = await FileSystem.getInfoAsync(uri);
          return {
            name,
            uri,
            size: info.exists && !info.isDirectory ? info.size : 0,
            modificationTime: info.exists ? info.modificationTime : 0,
            isDirectory: info.exists ? info.isDirectory : false,
          };
        })
      );
      
      // Filter out directories and sort by modification time descending
      const sortedFiles = fileInfos
        .filter((f) => !f.isDirectory)
        .sort((a, b) => b.modificationTime - a.modificationTime);
        
      setFiles(sortedFiles);
    } catch (e) {
      console.error("Failed to load files", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const deleteFile = async (uri: string) => {
    try {
      await FileSystem.deleteAsync(uri);
      setFiles((prev) => prev.filter((f) => f.uri !== uri));
      return true;
    } catch (e) {
      console.error("Failed to delete file", e);
      return false;
    }
  };

  const shareFile = async (uri: string) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (e) {
      console.error("Failed to share file", e);
    }
  };

  return {
    files,
    loading,
    refresh: loadFiles,
    deleteFile,
    shareFile,
  };
}
