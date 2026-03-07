import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { ACCESS_COOKIE } from "./cookies";
import { verifyAccessToken } from "./tokens";

export async function getCurrentUser() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  try {
    const claims = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        lastSeen: true,
        createdAt: true,
      },
    });
    return user;
  } catch {
    return null;
  }
}

