import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaShutdownHooksRegistered?: boolean;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Graceful shutdown for local/dev process restarts and container stops.
if (process.env.NODE_ENV !== "production" && !globalForPrisma.prismaShutdownHooksRegistered) {
  const shutdown = async () => {
    await prisma.$disconnect();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  globalForPrisma.prismaShutdownHooksRegistered = true;
}
