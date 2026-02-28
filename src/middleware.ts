import { NextResponse, type NextRequest } from "next/server";
import type { NextFetchEvent } from "next/server";
import { jwtVerify } from "jose";
import { z } from "zod";

import { ACCESS_COOKIE } from "./lib/auth/cookies";
import { getClientIp } from "./lib/request";

const ClaimsSchema = z.object({
  sub: z.string().min(1),
  role: z.enum(["ADMIN", "USER"]),
  typ: z.literal("access"),
});

function maybeTrackPostView(req: NextRequest, event: NextFetchEvent, userId?: string) {
  if (req.method !== "GET") return;
  const pathname = req.nextUrl.pathname;
  if (!pathname.startsWith("/posts/")) return;

  const slug = pathname.split("/")[2];
  if (!slug) return;

  const internalKey = process.env.INTERNAL_API_KEY ?? process.env.JWT_ACCESS_SECRET;
  if (!internalKey) return;

  const payload = {
    slug: decodeURIComponent(slug),
    userId: userId ?? null,
    ip: getClientIp(req),
  };

  const url = new URL("/api/internal/views", req.url);
  event.waitUntil(
    fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-key": internalKey,
      },
      body: JSON.stringify(payload),
    }).catch(() => null),
  );
}

export async function middleware(req: NextRequest, event: NextFetchEvent) {
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) {
    maybeTrackPostView(req, event);
    return NextResponse.next();
  }

  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    maybeTrackPostView(req, event);
    return NextResponse.next();
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const parsed = ClaimsSchema.safeParse(payload);
    if (!parsed.success) {
      maybeTrackPostView(req, event);
      return NextResponse.next();
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-auth-user-id", parsed.data.sub);
    requestHeaders.set("x-auth-user-role", parsed.data.role);
    maybeTrackPostView(req, event, parsed.data.sub);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    maybeTrackPostView(req, event);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/profile", "/posts/:path*"],
};
