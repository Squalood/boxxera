import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canVerify } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const fighter = await prisma.fighter.findUnique({ where: { id: params.id } });
  if (!fighter) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (!canVerify(user, fighter.commissionId)) {
    return NextResponse.json({ error: "Solo la comisión de esta jurisdicción puede verificar" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const action: "verify" | "reject" = body.action === "reject" ? "reject" : "verify";
  const notes: string | undefined = body.notes;

  const updated = await prisma.fighter.update({
    where: { id: params.id },
    data: {
      verificationStatus: action === "verify" ? "VERIFIED" : "REJECTED",
      verifiedAt: action === "verify" ? new Date() : null,
      verifiedById: user.id
    }
  });

  await prisma.verificationLog.create({
    data: {
      entityType: "Fighter",
      entityId: fighter.id,
      fighterId: fighter.id,
      action,
      notes,
      userId: user.id
    }
  });

  await logAudit({
    userId: user.id,
    action,
    entityType: "Fighter",
    entityId: fighter.id,
    oldValue: { verificationStatus: fighter.verificationStatus },
    newValue: { verificationStatus: updated.verificationStatus }
  });

  return NextResponse.json(updated);
}
