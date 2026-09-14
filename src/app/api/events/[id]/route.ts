import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageEvent, isGlobalAdmin } from "@/lib/rbac";
import { eventUpdateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

// Costs/revenues here are the same internal P&L data /economics computes —
// this must never be reachable without auth (see brief section 5).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      commission: true,
      promoter: { select: { id: true, name: true } },
      fights: { include: { fighterA: true, fighterB: true } },
      costs: { orderBy: { createdAt: "desc" } },
      revenues: { orderBy: { createdAt: "desc" } },
      opportunities: true,
      tasks: true
    }
  });
  if (!event) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (!isGlobalAdmin(user) && !canManageEvent(user, event)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return NextResponse.json(event);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const existing = await prisma.event.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (!isGlobalAdmin(user) && !canManageEvent(user, existing)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = eventUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.event.update({ where: { id: params.id }, data: parsed.data });

  await logAudit({
    userId: user!.id,
    action: "update",
    entityType: "Event",
    entityId: updated.id,
    oldValue: existing,
    newValue: updated
  });

  return NextResponse.json(updated);
}
