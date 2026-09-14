import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageCommission, isGlobalAdmin } from "@/lib/rbac";
import { commissionCreateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const commission = await prisma.commission.findUnique({
    where: { id: params.id },
    include: { city: true, fighters: true, gyms: true }
  });
  if (!commission) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(commission);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || !(isGlobalAdmin(user) || canManageCommission(user, params.id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = commissionCreateSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.commission.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const updated = await prisma.commission.update({
    where: { id: params.id },
    data: parsed.data
  });

  await logAudit({
    userId: user.id,
    action: "update",
    entityType: "Commission",
    entityId: updated.id,
    oldValue: existing,
    newValue: updated
  });

  return NextResponse.json(updated);
}
