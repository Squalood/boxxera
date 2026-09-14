import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isGlobalAdmin } from "@/lib/rbac";
import { supportRequestSchema } from "@/lib/validation";
import { SUPPORT_REQUEST_TYPES } from "@/lib/config";
import { logAudit } from "@/lib/audit";

/**
 * "Mi Apoyo BOXXERA" — a boxer taps one of a fixed set of request types.
 * This creates a Task for the BOXXERA team to follow up and point them to
 * the right person (doctor, lawyer, commission). It is navigation and
 * coordination, never a clinical or legal case file: no diagnosis fields,
 * no case history beyond what the boxer typed in `notes`.
 *
 * This is private, sensitive information — medical and legal requests.
 * SPONSOR and PROMOTER have NO access to this endpoint at all, full stop.
 */

async function canActOnFighter(
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
  fighterId: string
): Promise<boolean> {
  if (isGlobalAdmin(user)) return true;
  if (user.role === "FIGHTER") return user.fighterId === fighterId;
  if (user.role === "SPONSOR" || user.role === "PROMOTER") return false;

  if (user.role === "COMMISSION_ADMIN" || user.role === "GYM_ADMIN") {
    const fighter = await prisma.fighter.findUnique({ where: { id: fighterId } });
    if (!fighter) return false;
    if (user.role === "COMMISSION_ADMIN") return fighter.commissionId === user.commissionId;
    return fighter.gymId === user.gymId;
  }
  return false;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = supportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (!(await canActOnFighter(user, data.fighterId))) {
    return NextResponse.json({ error: "No autorizado para este boxeador" }, { status: 403 });
  }

  const meta = SUPPORT_REQUEST_TYPES.find((t) => t.value === data.requestType);
  const label = meta?.label ?? data.requestType;
  const category = meta?.category ?? "other";

  const task = await prisma.task.create({
    data: {
      title: label,
      category,
      requestType: data.requestType as any,
      fighterId: data.fighterId,
      notes: data.notes || null,
      status: "OPEN"
    }
  });

  await logAudit({
    userId: user.id,
    action: "create",
    entityType: "Task",
    entityId: task.id,
    newValue: task
  });

  return NextResponse.json(task, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (user.role === "SPONSOR" || user.role === "PROMOTER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const requestedFighterId = searchParams.get("fighterId") ?? undefined;

  // A specific fighterId was requested — verify access to exactly that fighter.
  if (requestedFighterId) {
    if (!(await canActOnFighter(user, requestedFighterId))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const tasks = await prisma.task.findMany({
      where: { requestType: { not: null }, fighterId: requestedFighterId },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(tasks);
  }

  // No fighterId given: scope by role. A FIGHTER always sees only their own;
  // commission/gym admins see only their jurisdiction; global admin sees all.
  // Nothing lists every boxer's requests just because someone is logged in.
  let scope: Record<string, unknown>;
  if (isGlobalAdmin(user)) {
    scope = {};
  } else if (user.role === "FIGHTER" && user.fighterId) {
    scope = { fighterId: user.fighterId };
  } else if (user.role === "COMMISSION_ADMIN" && user.commissionId) {
    scope = { fighter: { commissionId: user.commissionId } };
  } else if (user.role === "GYM_ADMIN" && user.gymId) {
    scope = { fighter: { gymId: user.gymId } };
  } else {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const tasks = await prisma.task.findMany({
    where: { requestType: { not: null }, ...scope },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(tasks);
}
