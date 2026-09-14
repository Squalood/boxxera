import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageCommission, canManageGym, isGlobalAdmin } from "@/lib/rbac";
import { gymCreateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const gym = await prisma.gym.findUnique({
    where: { id: params.id },
    include: { city: true, commission: true, fighters: true }
  });
  if (!gym) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(gym);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const existing = await prisma.gym.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const allowed =
    isGlobalAdmin(user) || canManageGym(user, existing.id) || canManageCommission(user, existing.commissionId);
  if (!allowed) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const parsed = gymCreateSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.gym.update({ where: { id: params.id }, data: parsed.data });

  await logAudit({
    userId: user!.id,
    action: "update",
    entityType: "Gym",
    entityId: updated.id,
    oldValue: existing,
    newValue: updated
  });

  return NextResponse.json(updated);
}
