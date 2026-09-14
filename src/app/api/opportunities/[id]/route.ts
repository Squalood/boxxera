import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageOpportunity, canApproveOpportunity } from "@/lib/rbac";
import { opportunityStatusSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { createTasksForApprovedOpportunity } from "@/lib/engine/tasks";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const opportunity = await prisma.fightOpportunity.findUnique({
    where: { id: params.id },
    include: {
      fighterA: { include: { gym: true, city: true } },
      fighterB: { include: { gym: true, city: true } },
      commission: true,
      createdBy: { select: { id: true, name: true } },
      tasks: true,
      fight: true
    }
  });
  if (!opportunity) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const isInvolvedFighter =
    user.role === "FIGHTER" && (user.fighterId === opportunity.fighterAId || user.fighterId === opportunity.fighterBId);
  const allowed =
    canManageOpportunity(user, opportunity) || canApproveOpportunity(user, opportunity) || isInvolvedFighter;
  if (!allowed) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  return NextResponse.json(opportunity);
}

// Status transitions are intentionally narrow: DISCOVERED -> SUGGESTED ->
// CONTACTING -> NEGOTIATING can be moved by whoever manages the opportunity.
// APPROVED/REJECTED require commission-level authority (see canApproveOpportunity)
// — this is the human-in-the-loop gate the brief requires. Conversion to a
// Fight is a separate endpoint (/convert), not a status value here.
const APPROVAL_STATES = new Set(["APPROVED", "REJECTED"]);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const existing = await prisma.fightOpportunity.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const body = await req.json();
  const parsed = opportunityStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const { status } = parsed.data;

  if (existing.status === "CONVERTED_TO_FIGHT") {
    return NextResponse.json({ error: "Esta oportunidad ya fue convertida a pelea" }, { status: 409 });
  }

  if (APPROVAL_STATES.has(status)) {
    if (!canApproveOpportunity(user, existing)) {
      return NextResponse.json(
        { error: "Solo la comisión de esta jurisdicción (o un admin global) puede aprobar/rechazar" },
        { status: 403 }
      );
    }
  } else if (!canManageOpportunity(user, existing)) {
    return NextResponse.json({ error: "Fuera de tu alcance" }, { status: 403 });
  }

  const updated = await prisma.fightOpportunity.update({
    where: { id: params.id },
    data: { status }
  });

  if (status === "APPROVED") {
    await createTasksForApprovedOpportunity(updated.id);
  }

  await logAudit({
    userId: user.id,
    action: `status:${status.toLowerCase()}`,
    entityType: "FightOpportunity",
    entityId: updated.id,
    oldValue: { status: existing.status },
    newValue: { status: updated.status }
  });

  return NextResponse.json(updated);
}
