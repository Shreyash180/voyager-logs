import { withRoute } from "@/lib/http/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  return withRoute(async () => {
    await prisma.$queryRaw`SELECT 1`;
    return {
      ok: true,
      service: "voyager-logs",
      timestamp: new Date().toISOString(),
    };
  });
}
