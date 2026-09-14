import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isGlobalAdmin, canManageCommission, isPromoter } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

// Event listing with fights/costs/revenues counts is dashboard/administrative
// data (not the public "próximos eventos" the landing shows — that reads
// directly via a server component with a hand-picked safe shape).
//
// Jurisdiction scoping lives in the query itself — request filters can only
// narrow what a role is allowed to see, never widen it.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let scope: Record<string, unknown> = {};
  if (isGlobalAdmin(user)) {
    scope = {};
  } else if (user.role === "COMMISSION_ADMIN" && user.commissionId) {
    scope = { commissionId: user.commissionId };
  } else if (user.role === "PROMOTER") {
    scope = { promoterId: user.id };
  } else if (user.role === "GYM_ADMIN" && user.gymId) {
    scope = { fights: { some: { OR: [{ fighterA: { gymId: user.gymId } }, { fighterB: { gymId: user.gymId } }] } } };
  } else if (user.role === "FIGHTER" && user.fighterId) {
    scope = { fights: { some: { OR: [{ fighterAId: user.fighterId }, { fighterBId: user.fighterId }] } } };
  } else {
    // SPONSOR: use /dashboard/sponsor/discover's own controlled query, not
    // this administrative endpoint. COMMUNITY_MEMBER: no admin access either.
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const events = await prisma.event.findMany({
    where: scope,
    include: {
      commission: true,
      promoter: { select: { id: true, name: true } },
      fights: { include: { fighterA: true, fighterB: true } },
      _count: { select: { costs: true, revenues: true, opportunities: true } }
    },
    orderBy: { date: "desc" }
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { name, date, city, venue, commissionId, capacity, expectedAttendance, eventOwner } = body;

  if (!name || !date || !city) {
    return NextResponse.json({ error: "name, date y city son requeridos" }, { status: 400 });
  }
  if (!isGlobalAdmin(user) && !canManageCommission(user, commissionId) && !isPromoter(user)) {
    return NextResponse.json({ error: "No autorizado a crear eventos" }, { status: 403 });
  }

  const event = await prisma.event.create({
    data: {
      name,
      date: new Date(date),
      city,
      venue: venue || null,
      commissionId: commissionId || null,
      capacity: capacity ?? null,
      expectedAttendance: expectedAttendance ?? null,
      eventOwner: eventOwner ?? (isPromoter(user) ? "EXTERNAL_PROMOTER" : "BOXXERA"),
      promoterId: isPromoter(user) ? user.id : null,
      status: "SCHEDULED"
    }
  });

  await logAudit({ userId: user.id, action: "create", entityType: "Event", entityId: event.id, newValue: event });

  return NextResponse.json(event, { status: 201 });
}
