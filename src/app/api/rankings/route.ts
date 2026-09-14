import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isGlobalAdmin, canManageCommission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const commissionId = searchParams.get("commissionId") ?? undefined;
  const weightClass = searchParams.get("weightClass") ?? undefined;

  const rankings = await prisma.ranking.findMany({
    where: { ...(commissionId ? { commissionId } : {}), ...(weightClass ? { weightClass } : {}) },
    include: {
      commission: true,
      entries: { include: { fighter: true }, orderBy: { position: "asc" } }
    },
    orderBy: { updatedAt: "desc" }
  });
  return NextResponse.json(rankings);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { commissionId, weightClass, region, period } = body;

  if (!weightClass || !period) {
    return NextResponse.json({ error: "weightClass y period son requeridos" }, { status: 400 });
  }
  if (!isGlobalAdmin(user) && !canManageCommission(user, commissionId)) {
    return NextResponse.json({ error: "Fuera de tu jurisdicción" }, { status: 403 });
  }

  const ranking = await prisma.ranking.create({
    data: { commissionId: commissionId || null, weightClass, region: region || null, period }
  });

  await logAudit({ userId: user.id, action: "create", entityType: "Ranking", entityId: ranking.id, newValue: ranking });

  return NextResponse.json(ranking, { status: 201 });
}
