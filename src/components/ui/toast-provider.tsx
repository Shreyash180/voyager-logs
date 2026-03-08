"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastKind = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  kind: ToastKind;
};

type ToastContextValue = {
  push: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, kind: ToastKind = "info") => {
    const id = typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, kind }].slice(-4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 mx-auto flex w-full max-w-md flex-col gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg border px-3 py-2 text-sm shadow-md backdrop-blur ${
              toast.kind === "success"
                ? "border-emerald-300/40 bg-emerald-500/15 text-emerald-100"
                : toast.kind === "error"
                  ? "border-red-300/40 bg-red-500/15 text-red-100"
                  : "border-cyan-300/40 bg-cyan-500/15 text-cyan-100"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
