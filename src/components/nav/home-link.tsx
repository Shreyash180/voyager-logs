"use client";

import { useRouter } from "next/navigation";

export function HomeLink() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="border-b border-transparent pb-0.5 hover:border-cyan-300/70"
      onClick={() => {
        router.push("/");
        router.refresh();
      }}
    >
      Home
    </button>
  );
}
