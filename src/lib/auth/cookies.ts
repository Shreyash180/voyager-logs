import { cookies } from "next/headers";

export const ACCESS_COOKIE = "vl_access";
export const REFRESH_COOKIE = "vl_refresh";

type CookieOptions = {
  maxAgeSeconds?: number;
};

function cookieBase() {
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
  };
}

export async function setAuthCookies(params: {
  accessToken: string;
  refreshToken: string;
}) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, params.accessToken, {
    ...cookieBase(),
    maxAge: 60 * 15,
  });

  store.set(REFRESH_COOKIE, params.refreshToken, {
    ...cookieBase(),
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.set(ACCESS_COOKIE, "", { ...cookieBase(), maxAge: 0 });
  store.set(REFRESH_COOKIE, "", { ...cookieBase(), maxAge: 0 });
}

export async function readAccessCookie() {
  return (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
}

export async function readRefreshCookie() {
  return (await cookies()).get(REFRESH_COOKIE)?.value ?? null;
}
