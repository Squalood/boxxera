import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isGlobalAdmin, isSponsorUser } from "@/lib/rbac";
import { sponsorshipCreateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

// Never public: sponsor identity, contact, amounts, notes, and the BOXXERA
// responsible are all private pipeline data (see brief section 3).
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;

  // A sponsor only ever sees their own pipeline; everyone else needs
  // BOXXERA-admin authority. No other role has an approved reason yet.
  let scope: Record<string, unknown> = {};
  if (!isGlobalAdmin(user)) {
    if (isSponsorUser(user) && user.sponsorId) {
      scope = { sponsorId: user.sponsorId };
    } else {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  const sponsorships = await prisma.sponsorship.findMany({
    where: { ...scope, ...(status ? { status: status as any } : {}) },
    include: {
      sponsor: true,
      fighter: true,
      event: true,
      responsible: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(sponsorships);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isGlobalAdmin(user)) {
    return NextResponse.json({ error: "Solo BOXXERA admin puede crear registros de patrocinio" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = sponsorshipCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const sponsorship = await prisma.sponsorship.create({
    data: {
      sponsorId: data.sponsorId,
      program: data.program,
      fighterId: data.fighterId || null,
      eventId: data.eventId || null,
      proposedAmount: data.proposedAmount ?? null,
      currency: data.currency,
      benefits: data.benefits || null,
      notes: data.notes || null,
      responsibleId: user.id,
      status: "DISCOVERED"
    }
  });

  await logAudit({
    userId: user.id,
    action: "create",
    entityType: "Sponsorship",
    entityId: sponsorship.id,
    newValue: sponsorship
  });

  return NextResponse.json(sponsorship, { status: 201 });
}
