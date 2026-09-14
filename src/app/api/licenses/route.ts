import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageCommission, isGlobalAdmin } from "@/lib/rbac";
import { licenseCreateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const expiringBefore = searchParams.get("expiringBefore");

  const licenses = await prisma.license.findMany({
    where: expiringBefore ? { expiresAt: { lte: new Date(expiringBefore) }, status: "ACTIVE" } : {},
    include: { fighter: true, commission: true },
    orderBy: { expiresAt: "asc" }
  });
  return NextResponse.json(licenses);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = licenseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (!isGlobalAdmin(user) && !canManageCommission(user, data.commissionId)) {
    return NextResponse.json({ error: "Fuera de tu jurisdicción" }, { status: 403 });
  }

  const license = await prisma.license.create({
    data: {
      licenseNumber: data.licenseNumber,
      fighterId: data.fighterId,
      commissionId: data.commissionId,
      type: data.type,
      issuedAt: new Date(data.issuedAt),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      documentUrl: data.documentUrl || null,
      notes: data.notes || null,
      status: "ACTIVE"
    }
  });

  await logAudit({ userId: user.id, action: "create", entityType: "License", entityId: license.id, newValue: license });

  return NextResponse.json(license, { status: 201 });
}
