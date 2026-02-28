import type { NextRequest } from "next/server";

export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

export function getActorKey(req: NextRequest): string {
  const userId = req.headers.get("x-auth-user-id");
  if (userId) return `user:${userId}`;
  return `ip:${getClientIp(req)}`;
}
