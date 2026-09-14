import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isGlobalAdmin } from "@/lib/rbac";
import { sponsorCreateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const sponsors = await prisma.sponsor.findMany({
    include: { sponsorships: { include: { fighter: true, event: true } } },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(sponsors);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isGlobalAdmin(user)) {
    return NextResponse.json({ error: "Solo BOXXERA admin puede registrar sponsors" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = sponsorCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const sponsor = await prisma.sponsor.create({
    data: {
      companyName: data.companyName,
      contactName: data.contactName || null,
      contactEmail: data.contactEmail || null,
      industry: data.industry || null,
      city: data.city || null,
      website: data.website || null
    }
  });

  await logAudit({ userId: user.id, action: "create", entityType: "Sponsor", entityId: sponsor.id, newValue: sponsor });

  return NextResponse.json(sponsor, { status: 201 });
}
