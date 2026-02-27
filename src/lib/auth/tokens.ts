import jwt from "jsonwebtoken";

import { getServerEnv } from "../config/server";

export type AuthRole = "ADMIN" | "USER";

export type AccessTokenClaims = {
  sub: string;
  role: AuthRole;
  typ: "access";
};

export type RefreshTokenClaims = {
  sub: string;
  role: AuthRole;
  typ: "refresh";
};

function getAccessSecret() {
  return getServerEnv().JWT_ACCESS_SECRET;
}

function getRefreshSecret() {
  return getServerEnv().JWT_REFRESH_SECRET;
}

export function signAccessToken(user: { id: string; role: AuthRole }) {
  const claims: AccessTokenClaims = { sub: user.id, role: user.role, typ: "access" };
  return jwt.sign(claims, getAccessSecret(), {
    expiresIn: "15m",
  });
}

export function signRefreshToken(user: { id: string; role: AuthRole }) {
  const claims: RefreshTokenClaims = {
    sub: user.id,
    role: user.role,
    typ: "refresh",
  };
  return jwt.sign(claims, getRefreshSecret(), {
    expiresIn: "7d",
  });
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  const decoded = jwt.verify(token, getAccessSecret());
  return decoded as AccessTokenClaims;
}

export function verifyRefreshToken(token: string): RefreshTokenClaims {
  const decoded = jwt.verify(token, getRefreshSecret());
  return decoded as RefreshTokenClaims;
}

