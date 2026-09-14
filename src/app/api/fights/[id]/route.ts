import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isGlobalAdmin, canManageCommission, canManageEvent } from "@/lib/rbac";
import { fightStatusUpdateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const fight = await prisma.fight.findUnique({
    where: { id: params.id },
    include: { fighterA: true, fighterB: true, event: true, opportunity: true, tasks: true }
  });
  if (!fight) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(fight);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const existing = await prisma.fight.findUnique({ where: { id: params.id }, include: { event: true } });
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const allowed =
    isGlobalAdmin(user) ||
    canManageCommission(user, existing.event.commissionId) ||
    canManageEvent(user, existing.event);
  if (!allowed) return NextResponse.json({ error: "Fuera de tu alcance" }, { status: 403 });

  const body = await req.json();
  const parsed = fightStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // CONFIRMED requires all three approval gates to already be APPROVED —
  // this is the one rule the engine enforces server-side, not just in the UI,
  // so "aprobación automática de pelea" never happens by accident.
  const nextCommission = data.commissionStatus ?? existing.commissionStatus;
  const nextMedical = data.medicalStatus ?? existing.medicalStatus;
  const nextContract = data.contractStatus ?? existing.contractStatus;
  if (
    data.status === "CONFIRMED" &&
    !(nextCommission === "APPROVED" && nextMedical === "APPROVED" && nextContract === "APPROVED")
  ) {
    return NextResponse.json(
      { error: "No se puede confirmar: faltan aprobaciones de comisión, médica o de contrato" },
      { status: 409 }
    );
  }

  const updated = await prisma.fight.update({
    where: { id: params.id },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.purseA !== undefined ? { purseA: data.purseA } : {}),
      ...(data.purseB !== undefined ? { purseB: data.purseB } : {}),
      ...(data.commissionStatus !== undefined ? { commissionStatus: data.commissionStatus } : {}),
      ...(data.medicalStatus !== undefined ? { medicalStatus: data.medicalStatus } : {}),
      ...(data.contractStatus !== undefined ? { contractStatus: data.contractStatus } : {})
    }
  });

  await logAudit({
    userId: user.id,
    action: "update",
    entityType: "Fight",
    entityId: updated.id,
    oldValue: existing,
    newValue: updated
  });

  return NextResponse.json(updated);
}
