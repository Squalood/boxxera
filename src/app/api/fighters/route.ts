import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageCommission, canManageGym, isGlobalAdmin } from "@/lib/rbac";
import { fighterCreateSchema } from "@/lib/validation";
import { uniqueFighterSlug } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const commissionId = searchParams.get("commissionId") ?? undefined;
  const gymId = searchParams.get("gymId") ?? undefined;

  const fighters = await prisma.fighter.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(commissionId ? { commissionId } : {}),
      ...(gymId ? { gymId } : {})
    },
    include: { city: true, gym: true, commission: true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(fighters);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = fighterCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // Scope check: a commission/gym admin can only create fighters within their own scope
  const allowed =
    isGlobalAdmin(user) ||
    (data.commissionId && canManageCommission(user, data.commissionId)) ||
    (data.gymId && canManageGym(user, data.gymId));

  if (!allowed) {
    return NextResponse.json({ error: "Fuera de tu jurisdicción" }, { status: 403 });
  }

  const slug = await uniqueFighterSlug(data.publicName);

  const fighter = await prisma.fighter.create({
    data: {
      slug,
      fullName: data.fullName,
      publicName: data.publicName,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      nationality: data.nationality || null,
      cityId: data.cityId || null,
      gender: data.gender,
      weightClass: data.weightClass,
      photoUrl: data.photoUrl || null,
      bio: data.bio || null,
      commissionId: data.commissionId || null,
      gymId: data.gymId || null,
      coachName: data.coachName || null,
      licenseNumber: data.licenseNumber || null,
      status: "PENDING",
      verificationStatus: "UNVERIFIED"
    }
  });

  if (fighter.gymId) {
    await prisma.fighterGymHistory.create({
      data: { fighterId: fighter.id, gymId: fighter.gymId, current: true }
    });
  }

  await logAudit({
    userId: user.id,
    action: "create",
    entityType: "Fighter",
    entityId: fighter.id,
    newValue: fighter
  });

  return NextResponse.json(fighter, { status: 201 });
}
