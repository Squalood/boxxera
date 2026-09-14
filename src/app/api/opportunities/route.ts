import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isGlobalAdmin } from "@/lib/rbac";
import { opportunityCreateSchema } from "@/lib/validation";
import { validateOpportunity, hasBlockingIssues } from "@/lib/engine/opportunityValidation";
import { computeMatchmaking } from "@/lib/engine/matchmaking";
import { logAudit } from "@/lib/audit";

// Administrative listing — requires auth. Public consumers (landing/roster)
// read FightOpportunity directly via server components with their own
// hand-picked safe fields; they never call this endpoint. See brief:
// "separar PUBLIC OPPORTUNITY DATA de ADMINISTRATIVE OPPORTUNITY DATA".
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const commissionIdParam = searchParams.get("commissionId") ?? undefined;

  // Jurisdiction/role scoping applied to the query itself, not just the UI.
  // Request filters may only NARROW what a role is allowed to see — they can
  // never widen it. That's why commissionIdParam is folded in below only
  // for global admins; every other role's scope key is fixed by their role
  // and is never overwritten by a query param.
  let scope: Record<string, unknown> = {};
  if (isGlobalAdmin(user)) {
    if (commissionIdParam) scope = { commissionId: commissionIdParam };
  } else if (user.role === "COMMISSION_ADMIN" && user.commissionId) {
    scope = { commissionId: user.commissionId };
  } else if (user.role === "PROMOTER") {
    scope = { createdById: user.id };
  } else if (user.role === "GYM_ADMIN" && user.gymId) {
    scope = { OR: [{ fighterA: { gymId: user.gymId } }, { fighterB: { gymId: user.gymId } }] };
  } else if (user.role === "FIGHTER" && user.fighterId) {
    scope = { OR: [{ fighterAId: user.fighterId }, { fighterBId: user.fighterId }] };
  } else {
    // SPONSOR, COMMUNITY_MEMBER, or anything else without an explicit
    // policy: no administrative access to opportunities.
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const opportunities = await prisma.fightOpportunity.findMany({
    where: {
      ...scope,
      ...(status ? { status: status as any } : {})
    },
    include: { fighterA: true, fighterB: true, commission: true, createdBy: { select: { id: true, name: true } } },
    orderBy: [{ totalScore: "desc" }, { createdAt: "desc" }]
  });

  return NextResponse.json(opportunities);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Only these roles may create administrative FightOpportunity records.
  // SPONSOR, COMMUNITY_MEMBER, FIGHTER, GYM_ADMIN, and anything else: no.
  const canCreate =
    isGlobalAdmin(user) ||
    (user.role === "COMMISSION_ADMIN" && !!user.commissionId) ||
    user.role === "PROMOTER";
  if (!canCreate) {
    return NextResponse.json({ error: "No autorizado a crear oportunidades" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = opportunityCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // A COMMISSION_ADMIN can never file an opportunity under another
  // commission's name, no matter what the client sent — their own
  // commissionId always wins.
  const commissionId = user.role === "COMMISSION_ADMIN" ? user.commissionId! : data.commissionId || null;

  // allowOverride bypasses blocking validation rules — it is not something
  // a client boolean gets to decide. Only staff roles that can also APPROVE
  // an opportunity get to request it; a promoter proposing a match never
  // gets to self-override the rules that protect against bad matchups.
  const allowOverride = isGlobalAdmin(user) || user.role === "COMMISSION_ADMIN" ? !!data.allowOverride : false;

  // `source` says who originated the opportunity — it's identity-adjacent,
  // so it's derived from the actual role, not taken from the client as-is.
  // Global staff may still tag a specific origin (e.g. ALGORITHM, GYM) when
  // filing on someone else's behalf; everyone else is pinned to their own role.
  const source = isGlobalAdmin(user)
    ? data.source
    : user.role === "COMMISSION_ADMIN"
    ? "COMMISSION"
    : "PROMOTER";

  const [fighterA, fighterB] = await Promise.all([
    prisma.fighter.findUnique({ where: { id: data.fighterAId } }),
    prisma.fighter.findUnique({ where: { id: data.fighterBId } })
  ]);
  if (!fighterA || !fighterB) {
    return NextResponse.json({ error: "Uno o ambos boxeadores no existen" }, { status: 404 });
  }

  const proposedDate = data.proposedDate ? new Date(data.proposedDate) : null;
  const issues = await validateOpportunity(fighterA, fighterB, {
    proposedDate,
    allowOverride
  });

  if (hasBlockingIssues(issues)) {
    return NextResponse.json(
      { error: "La oportunidad no pasa las reglas de validación", issues },
      { status: 422 }
    );
  }

  const match = computeMatchmaking(fighterA, fighterB, { proposedCity: data.proposedCity });

  const opportunity = await prisma.fightOpportunity.create({
    data: {
      fighterAId: data.fighterAId,
      fighterBId: data.fighterBId,
      weightClass: data.weightClass,
      proposedDate,
      proposedCity: data.proposedCity || null,
      proposedVenue: data.proposedVenue || null,
      commissionId,
      source,
      createdById: user.id,
      status: "DISCOVERED",
      sportingScore: match.sportingScore,
      commercialScore: match.commercialScore,
      logisticsScore: match.logisticsScore,
      economicScore: match.economicScore,
      totalScore: match.totalScore,
      dataConfidence: match.dataConfidence,
      estimatedCost: match.estimatedCost,
      estimatedRevenue: match.estimatedRevenue,
      estimatedProfit: match.estimatedProfit,
      explanation: match.explanation as any
    }
  });

  await logAudit({
    userId: user.id,
    action: "create",
    entityType: "FightOpportunity",
    entityId: opportunity.id,
    newValue: { ...opportunity, validationIssues: issues }
  });

  return NextResponse.json({ opportunity, validationIssues: issues }, { status: 201 });
}
