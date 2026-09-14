import { prisma } from "@/lib/prisma";

type AuditParams = {
  userId?: string | null;
  action: string; // "create" | "update" | "delete" | "verify" | "suspend" | ...
  entityType: string; // "Fighter" | "License" | "Commission" | ...
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
};

/**
 * Every sensitive mutation in BOXXERA should call this. Since BOXXERA holds
 * official/verified information, an untracked change is treated as a bug,
 * not a shortcut.
 */
export async function logAudit(params: AuditParams) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValue: params.oldValue as any,
      newValue: params.newValue as any,
      ipAddress: params.ipAddress ?? null
    }
  });
}
