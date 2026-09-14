import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isSponsorUser } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

/**
 * A logged-in SPONSOR expresses interest in a fighter or event they
 * discovered. This can only ever create/move a Sponsorship to INTERESTED —
 * everything past that (CONTACTED, NEGOTIATING, CONFIRMED) is BOXXERA staff
 * work via /api/sponsorships/[id].
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isSponsorUser(user) || !user.sponsorId) {
    return NextResponse.json({ error: "Solo un sponsor puede expresar interés" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const fighterId: string | undefined = body.fighterId || undefined;
  const eventId: string | undefined = body.eventId || undefined;
  if (!fighterId && !eventId) {
    return NextResponse.json({ error: "Se necesita un boxeador o un evento" }, { status: 400 });
  }

  const existing = await prisma.sponsorship.findFirst({
    where: { sponsorId: user.sponsorId, fighterId: fighterId ?? null, eventId: eventId ?? null }
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const fighter = fighterId ? await prisma.fighter.findUnique({ where: { id: fighterId } }) : null;
  const event = eventId ? await prisma.event.findUnique({ where: { id: eventId } }) : null;

  const sponsorship = await prisma.sponsorship.create({
    data: {
      sponsorId: user.sponsorId,
      program: fighter ? `Interés en ${fighter.publicName}` : `Interés en ${event?.name ?? "evento"}`,
      fighterId: fighterId ?? null,
      eventId: eventId ?? null,
      status: "INTERESTED"
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
