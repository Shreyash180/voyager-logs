import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { POST as loginPost } from "../../src/app/api/auth/login/route";

describe("POST /api/auth/login", () => {
  it("returns validation error for malformed payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "" }),
    });

    const res = await loginPost(req);
    expect(res.status).toBe(400);
  });
});
