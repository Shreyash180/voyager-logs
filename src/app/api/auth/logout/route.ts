import { withRoute } from "@/lib/http/route";
import { clearAuthCookies } from "@/lib/auth/cookies";

export const runtime = "nodejs";

export async function POST() {
  return withRoute(async () => {
    await clearAuthCookies();
    return { ok: true };
  });
}

