import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { z } from "zod";

import { ACCESS_COOKIE } from "./lib/auth/cookies";

const ClaimsSchema = z.object({
  sub: z.string().min(1),
  role: z.enum(["ADMIN", "USER"]),
  typ: z.literal("access"),
});

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.next();
  }

  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    return NextResponse.next();
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const parsed = ClaimsSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.next();
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-auth-user-id", parsed.data.sub);
    requestHeaders.set("x-auth-user-role", parsed.data.role);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/profile", "/posts/:path*"],
};
