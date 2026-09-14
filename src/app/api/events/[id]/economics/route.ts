import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageEvent, isGlobalAdmin } from "@/lib/rbac";
import { computeEventEconomics } from "@/lib/engine/eventEconomics";

// Internal P&L — never public (see brief section 5).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!isGlobalAdmin(user) && !canManageEvent(user, event)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const economics = await computeEventEconomics(params.id);
  return NextResponse.json(economics);
}
