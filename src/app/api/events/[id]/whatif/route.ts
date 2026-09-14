import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageEvent, isGlobalAdmin } from "@/lib/rbac";
import { computeEventEconomics } from "@/lib/engine/eventEconomics";
import { runWhatIf, standardScenarios, type WhatIfOverrides } from "@/lib/engine/whatIf";

// Internal simulation over internal P&L — same access rule as /economics.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!isGlobalAdmin(user) && !canManageEvent(user, event)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const base = await computeEventEconomics(params.id);
  const body = await req.json().catch(() => ({}));

  if (body.standard) {
    return NextResponse.json({ base, scenarios: standardScenarios(base) });
  }

  const overrides = (body.overrides ?? {}) as WhatIfOverrides;
  const scenario = runWhatIf(base, overrides, "CUSTOM");
  return NextResponse.json({ base, scenario });
}
