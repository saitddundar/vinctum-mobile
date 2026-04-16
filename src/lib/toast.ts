import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastState {
  message: string | null;
  type: ToastType;
  id: number;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  type: "info",
  id: 0,
  show: (message, type = "info") =>
    set((s) => ({ message, type, id: s.id + 1 })),
  hide: () => set({ message: null }),
}));

export const toast = {
  success: (msg: string) => useToast.getState().show(msg, "success"),
  error: (msg: string) => useToast.getState().show(msg, "error"),
  info: (msg: string) => useToast.getState().show(msg, "info"),
  warning: (msg: string) => useToast.getState().show(msg, "warning"),
};
