import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canApproveOpportunity, canManageEvent, isGlobalAdmin } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

/**
 * Converts an APPROVED FightOpportunity into a Fight. Per the brief: "Copiar
 * solamente información estructural. NO copiar indiscriminadamente todo el
 * estado económico." So only fighters/weight class/event carry over — scores,
 * estimates and explanation stay on the opportunity as history, not on the
 * Fight.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const opportunity = await prisma.fightOpportunity.findUnique({
    where: { id: params.id },
    include: { fight: true }
  });
  if (!opportunity) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  if (!canApproveOpportunity(user, opportunity)) {
    return NextResponse.json({ error: "Solo la comisión o un admin global puede convertir a pelea" }, { status: 403 });
  }
  if (opportunity.status !== "APPROVED") {
    return NextResponse.json({ error: "Solo una oportunidad APPROVED puede convertirse en pelea" }, { status: 409 });
  }
  if (opportunity.fight) {
    return NextResponse.json({ error: "Esta oportunidad ya tiene una pelea asociada" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const eventId: string | undefined = body.eventId;
  if (!eventId) {
    return NextResponse.json({ error: "eventId es requerido para crear la pelea" }, { status: 400 });
  }
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });

  // The user must also have authority over the TARGET event, not just over
  // the opportunity — a commission admin approving their own opportunity
  // doesn't automatically get to drop it into someone else's event/promoter.
  if (!isGlobalAdmin(user) && !canManageEvent(user, event)) {
    return NextResponse.json({ error: "No tienes autorización sobre el evento indicado" }, { status: 403 });
  }

  // Jurisdiction coherence: an opportunity filed under one commission can't
  // be inserted into an event that belongs to a different commission. If
  // either side has no commission set, there's nothing to compare, so it's
  // allowed through (global/promoter-owned events without a commission yet).
  if (opportunity.commissionId && event.commissionId && opportunity.commissionId !== event.commissionId) {
    return NextResponse.json(
      { error: "La comisión de la oportunidad y la del evento no coinciden" },
      { status: 409 }
    );
  }

  const fight = await prisma.fight.create({
    data: {
      eventId,
      fighterAId: opportunity.fighterAId,
      fighterBId: opportunity.fighterBId,
      weightClass: opportunity.weightClass,
      status: "DRAFT",
      opportunityId: opportunity.id
    }
  });

  const updatedOpportunity = await prisma.fightOpportunity.update({
    where: { id: opportunity.id },
    data: { status: "CONVERTED_TO_FIGHT", eventId }
  });

  await logAudit({
    userId: user.id,
    action: "convert_to_fight",
    entityType: "FightOpportunity",
    entityId: opportunity.id,
    newValue: { fightId: fight.id }
  });
  await logAudit({
    userId: user.id,
    action: "create",
    entityType: "Fight",
    entityId: fight.id,
    newValue: fight
  });

  return NextResponse.json({ fight, opportunity: updatedOpportunity }, { status: 201 });
}
