import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageMembership } from "@/lib/rbac";
import { membershipCreateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { DEFAULT_MEMBERSHIP_MONTHLY_PRICE } from "@/lib/config";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageMembership(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;

  // A COMMISSION_ADMIN only ever sees membresías of fighters in their own
  // jurisdiction — applied to the query, not just to the page's label.
  const scope =
    user.role === "COMMISSION_ADMIN"
      ? { fighter: { commissionId: user.commissionId ?? "__none__" } }
      : {};

  const memberships = await prisma.boxerMembership.findMany({
    where: { ...scope, ...(status ? { status: status as any } : {}) },
    include: { fighter: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(memberships);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageMembership(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = membershipCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const fighter = await prisma.fighter.findUnique({ where: { id: data.fighterId } });
  if (!fighter) return NextResponse.json({ error: "Boxeador no encontrado" }, { status: 404 });

  // A COMMISSION_ADMIN cannot create a membership for a fighter outside
  // their own jurisdiction, even if they know the fighterId.
  if (user.role === "COMMISSION_ADMIN" && fighter.commissionId !== user.commissionId) {
    return NextResponse.json({ error: "Ese boxeador no pertenece a tu comisión" }, { status: 403 });
  }

  const existing = await prisma.boxerMembership.findUnique({ where: { fighterId: data.fighterId } });
  if (existing) {
    return NextResponse.json({ error: "Este boxeador ya tiene una membresía" }, { status: 409 });
  }

  const membership = await prisma.boxerMembership.create({
    data: {
      fighterId: data.fighterId,
      monthlyPrice: data.monthlyPrice ?? DEFAULT_MEMBERSHIP_MONTHLY_PRICE,
      currency: data.currency,
      status: data.status
    }
  });

  await logAudit({
    userId: user.id,
    action: "create",
    entityType: "BoxerMembership",
    entityId: membership.id,
    newValue: membership
  });

  return NextResponse.json(membership, { status: 201 });
}
