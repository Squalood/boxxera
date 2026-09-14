import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageFighter, canManageCommission, canManageGym, isGlobalAdmin } from "@/lib/rbac";
import { fighterUpdateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

// Fields a boxer may edit on their own profile. Everything regulatory
// (status, commissionId, licenseNumber, verification, gymId, weight class,
// gender, etc.) is administrative-only, even though canManageFighter also
// grants the fighter themselves access to this endpoint for the fields
// below.
const FIGHTER_SELF_EDITABLE_FIELDS = ["publicName", "photoUrl", "bio", "coachName"] as const;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const fighter = await prisma.fighter.findUnique({
    where: { id: params.id },
    include: {
      city: true,
      gym: true,
      commission: true,
      fightRecords: { orderBy: { date: "desc" } },
      licenses: true,
      rankingEntries: { include: { ranking: true } },
      benefitGrants: { include: { benefit: true } },
      gymHistory: { include: { gym: true }, orderBy: { startDate: "desc" } }
    }
  });
  if (!fighter) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(fighter);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const existing = await prisma.fighter.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (!canManageFighter(user, existing)) {
    return NextResponse.json({ error: "Fuera de tu jurisdicción" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = fighterUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // canManageFighter grants access via multiple routes: global admin, the
  // fighter's own commission, their own gym, or the fighter themselves.
  // Self-service (the boxer editing their own profile) only gets the
  // personal-field whitelist below — regulatory fields stay administrative
  // even though the same endpoint/gate is shared.
  const hasAdminAuthority =
    isGlobalAdmin(user) || canManageCommission(user, existing.commissionId) || canManageGym(user, existing.gymId);
  const isSelfServiceOnly = !hasAdminAuthority && user.role === "FIGHTER" && user.fighterId === existing.id;

  if (isSelfServiceOnly) {
    const disallowed = (Object.keys(data) as (keyof typeof data)[]).filter(
      (key) => data[key] !== undefined && !(FIGHTER_SELF_EDITABLE_FIELDS as readonly string[]).includes(key)
    );
    if (disallowed.length > 0) {
      return NextResponse.json(
        {
          error: `No puedes editar estos campos desde tu perfil: ${disallowed.join(", ")}. Son administrativos.`
        },
        { status: 403 }
      );
    }
  }

  // If the gym is changing, close out the previous history row and open a new one.
  // (gymId is not in the self-service whitelist, so this only ever runs for
  // an admin-authorized request — a boxer can't reassign their own gym here.)
  if (data.gymId !== undefined && data.gymId !== existing.gymId) {
    await prisma.fighterGymHistory.updateMany({
      where: { fighterId: existing.id, current: true },
      data: { current: false, endDate: new Date() }
    });
    if (data.gymId) {
      await prisma.fighterGymHistory.create({
        data: { fighterId: existing.id, gymId: data.gymId, current: true }
      });
    }
  }

  const updated = await prisma.fighter.update({
    where: { id: params.id },
    data: {
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.publicName !== undefined ? { publicName: data.publicName } : {}),
      ...(data.dateOfBirth !== undefined ? { dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null } : {}),
      ...(data.nationality !== undefined ? { nationality: data.nationality } : {}),
      ...(data.cityId !== undefined ? { cityId: data.cityId } : {}),
      ...(data.gender !== undefined ? { gender: data.gender } : {}),
      ...(data.weightClass !== undefined ? { weightClass: data.weightClass } : {}),
      ...(data.photoUrl !== undefined ? { photoUrl: data.photoUrl } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
      ...(data.commissionId !== undefined ? { commissionId: data.commissionId } : {}),
      ...(data.gymId !== undefined ? { gymId: data.gymId } : {}),
      ...(data.coachName !== undefined ? { coachName: data.coachName } : {}),
      ...(data.licenseNumber !== undefined ? { licenseNumber: data.licenseNumber } : {}),
      ...(data.status !== undefined ? { status: data.status } : {})
    }
  });

  await logAudit({
    userId: user.id,
    action: "update",
    entityType: "Fighter",
    entityId: updated.id,
    oldValue: existing,
    newValue: updated
  });

  return NextResponse.json(updated);
}

// Fighters are never hard-deleted if they carry history — soft delete via status.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const existing = await prisma.fighter.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (!canManageFighter(user, existing)) {
    return NextResponse.json({ error: "Fuera de tu jurisdicción" }, { status: 403 });
  }

  const updated = await prisma.fighter.update({
    where: { id: params.id },
    data: { status: "INACTIVE" }
  });

  await logAudit({
    userId: user.id,
    action: "soft_delete",
    entityType: "Fighter",
    entityId: updated.id,
    oldValue: existing,
    newValue: updated
  });

  return NextResponse.json({ ok: true });
}
