import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/server";

export const runtime = "nodejs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  return <>{children}</>;
}

