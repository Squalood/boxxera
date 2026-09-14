import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isGlobalAdmin, canManageCommission } from "@/lib/rbac";
import { rankingEntrySchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ranking = await prisma.ranking.findUnique({ where: { id: params.id } });
  if (!ranking) return NextResponse.json({ error: "Ranking no encontrado" }, { status: 404 });

  if (!isGlobalAdmin(user) && !canManageCommission(user, ranking.commissionId)) {
    return NextResponse.json({ error: "Fuera de tu jurisdicción" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = rankingEntrySchema.safeParse({ ...body, rankingId: params.id });
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const entry = await prisma.rankingEntry.upsert({
    where: { rankingId_fighterId: { rankingId: data.rankingId, fighterId: data.fighterId } },
    update: { position: data.position, points: data.points ?? null, notes: data.notes ?? null },
    create: {
      rankingId: data.rankingId,
      fighterId: data.fighterId,
      position: data.position,
      points: data.points ?? null,
      notes: data.notes ?? null
    }
  });

  await logAudit({ userId: user.id, action: "upsert", entityType: "RankingEntry", entityId: entry.id, newValue: entry });

  return NextResponse.json(entry, { status: 201 });
}
