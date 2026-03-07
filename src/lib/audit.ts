import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function logAdminAudit(params: {
  actorId: string;
  targetUserId?: string;
  action: string;
  details?: Prisma.InputJsonValue;
}) {
  await prisma.adminAuditLog.create({
    data: {
      actorId: params.actorId,
      targetUserId: params.targetUserId,
      action: params.action,
      details: params.details,
    },
    select: { id: true },
  });
}
