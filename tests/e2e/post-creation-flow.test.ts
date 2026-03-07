import { describe, expect, it } from "vitest";

const BASE_URL = process.env.E2E_BASE_URL;
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

describe("post creation e2e flow", () => {
  it.skipIf(!BASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD)(
    "logs in as admin and creates a post",
    async () => {
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        }),
      });

      expect(loginRes.ok).toBe(true);
      const setCookie = loginRes.headers.get("set-cookie");
      expect(setCookie).toBeTruthy();

      const createRes = await fetch(`${BASE_URL}/api/posts`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: setCookie ?? "",
        },
        body: JSON.stringify({
          title: `E2E Post ${Date.now()}`,
          excerpt: "E2E excerpt",
          content: "This is an end-to-end post creation smoke test.",
          tags: ["e2e", "smoke"],
          published: true,
        }),
      });

      expect(createRes.ok).toBe(true);
    },
  );
});
