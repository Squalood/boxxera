import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageMembership } from "@/lib/rbac";
import { membershipUpdateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const membership = await prisma.boxerMembership.findUnique({
    where: { id: params.id },
    include: { fighter: true }
  });
  if (!membership) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const isOwnFighter = user?.role === "FIGHTER" && user.fighterId === membership.fighterId;
  const isOwnCommission =
    user?.role === "COMMISSION_ADMIN" && user.commissionId === membership.fighter.commissionId;
  const hasAdminAccess = canManageMembership(user) && (user?.role !== "COMMISSION_ADMIN" || isOwnCommission);
  if (!isOwnFighter && !hasAdminAccess) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return NextResponse.json(membership);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || !canManageMembership(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const existing = await prisma.boxerMembership.findUnique({ where: { id: params.id }, include: { fighter: true } });
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  // A COMMISSION_ADMIN can only edit membresías of fighters in their own
  // jurisdiction — checked against the actual fighter, not trusted from the URL.
  if (user.role === "COMMISSION_ADMIN" && existing.fighter.commissionId !== user.commissionId) {
    return NextResponse.json({ error: "Ese boxeador no pertenece a tu comisión" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = membershipUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const updated = await prisma.boxerMembership.update({
    where: { id: params.id },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.paymentStatus !== undefined ? { paymentStatus: data.paymentStatus } : {}),
      ...(data.monthlyPrice !== undefined ? { monthlyPrice: data.monthlyPrice } : {}),
      ...(data.startDate !== undefined ? { startDate: data.startDate ? new Date(data.startDate) : null } : {}),
      ...(data.renewalDate !== undefined ? { renewalDate: data.renewalDate ? new Date(data.renewalDate) : null } : {}),
      ...(data.lastPaymentDate !== undefined
        ? { lastPaymentDate: data.lastPaymentDate ? new Date(data.lastPaymentDate) : null }
        : {}),
      ...(data.status === "CANCELLED" && !existing.cancelledAt ? { cancelledAt: new Date() } : {})
    }
  });

  await logAudit({
    userId: user.id,
    action: "update",
    entityType: "BoxerMembership",
    entityId: updated.id,
    oldValue: existing,
    newValue: updated
  });

  return NextResponse.json(updated);
}
