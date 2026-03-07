import { describe, expect, it } from "vitest";

import { LoginSchema, RegisterSchema } from "../../src/lib/validation/auth";

describe("auth validation schemas", () => {
  it("accepts valid register payload", () => {
    const parsed = RegisterSchema.parse({
      name: "Voyager",
      email: "voyager@example.com",
      password: "securepassword123",
    });

    expect(parsed.email).toBe("voyager@example.com");
  });

  it("rejects short register password", () => {
    const result = RegisterSchema.safeParse({
      email: "voyager@example.com",
      password: "123",
    });

    expect(result.success).toBe(false);
  });

  it("requires both login fields", () => {
    const result = LoginSchema.safeParse({
      email: "voyager@example.com",
    });

    expect(result.success).toBe(false);
  });
});
