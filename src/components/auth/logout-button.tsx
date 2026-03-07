"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    if (loading) return;
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="border-b border-transparent pb-0.5 text-sm hover:border-cyan-300/70 disabled:opacity-60"
    >
      Logout
    </button>
  );
}

