import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isGlobalAdmin, isSponsorUser } from "@/lib/rbac";
import { sponsorshipUpdateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sponsorship = await prisma.sponsorship.findUnique({
    where: { id: params.id },
    include: {
      sponsor: true,
      fighter: true,
      event: true,
      responsible: { select: { id: true, name: true } }
    }
  });
  if (!sponsorship) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const isOwnSponsor = isSponsorUser(user) && user?.sponsorId === sponsorship.sponsorId;
  if (!isOwnSponsor && !isGlobalAdmin(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  return NextResponse.json(sponsorship);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const existing = await prisma.sponsorship.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const isOwnSponsor = isSponsorUser(user) && user.sponsorId === existing.sponsorId;
  // A sponsor user may only move their own pipeline entry toward INTERESTED —
  // everything past that (CONTACTED onward) is BOXXERA staff work.
  const body = await req.json();
  const parsed = sponsorshipUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (isOwnSponsor && !isGlobalAdmin(user)) {
    if (Object.keys(data).some((k) => k !== "status") || (data.status && data.status !== "INTERESTED")) {
      return NextResponse.json(
        { error: "Como sponsor solo puedes marcar tu interés — el resto lo gestiona el equipo BOXXERA" },
        { status: 403 }
      );
    }
  } else if (!isGlobalAdmin(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const updated = await prisma.sponsorship.update({
    where: { id: params.id },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.confirmedAmount !== undefined ? { confirmedAmount: data.confirmedAmount } : {}),
      ...(data.responsibleId !== undefined ? { responsibleId: data.responsibleId } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {})
    }
  });

  await logAudit({
    userId: user.id,
    action: "update",
    entityType: "Sponsorship",
    entityId: updated.id,
    oldValue: existing,
    newValue: updated
  });

  return NextResponse.json(updated);
}
