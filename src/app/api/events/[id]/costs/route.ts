import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageEvent, isGlobalAdmin } from "@/lib/rbac";
import { eventCostCreateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  if (!isGlobalAdmin(user) && !canManageEvent(user, event)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const costs = await prisma.eventCost.findMany({ where: { eventId: params.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(costs);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  if (!isGlobalAdmin(user) && !canManageEvent(user, event)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = eventCostCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const cost = await prisma.eventCost.create({ data: { eventId: params.id, ...parsed.data } });

  await logAudit({ userId: user.id, action: "create", entityType: "EventCost", entityId: cost.id, newValue: cost });

  return NextResponse.json(cost, { status: 201 });
}
