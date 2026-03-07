"use client";

import { useEffect } from "react";

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

export function AuthHeartbeat() {
  useEffect(() => {
    let mounted = true;

    const ping = async () => {
      if (!mounted) return;
      try {
        await fetch("/api/auth/me?ping=1", { cache: "no-store" });
      } catch {
        // Best effort heartbeat only.
      }
    };

    void ping();
    const interval = window.setInterval(() => {
      void ping();
    }, HEARTBEAT_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void ping();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
