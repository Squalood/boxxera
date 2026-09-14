import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isGlobalAdmin } from "@/lib/rbac";
import { commissionCreateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const commissions = await prisma.commission.findMany({
    include: { city: { include: { region: { include: { country: true } } } }, _count: { select: { fighters: true, gyms: true } } },
    orderBy: { name: "asc" }
  });
  return NextResponse.json(commissions);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isGlobalAdmin(user)) {
    return NextResponse.json({ error: "Solo BOXXERA admin puede crear comisiones" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = commissionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const commission = await prisma.commission.create({
    data: {
      name: data.name,
      shortName: data.shortName || null,
      cityId: data.cityId,
      jurisdiction: data.jurisdiction || null,
      logoUrl: data.logoUrl || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null
    }
  });

  await logAudit({ userId: user.id, action: "create", entityType: "Commission", entityId: commission.id, newValue: commission });

  return NextResponse.json(commission, { status: 201 });
}
