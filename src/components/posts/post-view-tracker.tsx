"use client";

import { useEffect } from "react";

export function PostViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return;

    const key = `voyager:viewed:${slug}`;
    try {
      if (window.sessionStorage.getItem(key) === "1") {
        return;
      }
      window.sessionStorage.setItem(key, "1");
    } catch {
      // Non-blocking: sessionStorage may be unavailable in some privacy modes.
    }

    void fetch("/api/internal/views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
    }).catch(() => null);
  }, [slug]);

  return null;
}
