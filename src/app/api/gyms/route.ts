import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageCommission, isGlobalAdmin } from "@/lib/rbac";
import { gymCreateSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const gyms = await prisma.gym.findMany({
    include: { city: true, commission: true, _count: { select: { fighters: true } } },
    orderBy: { name: "asc" }
  });
  return NextResponse.json(gyms);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = gymCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const allowed = isGlobalAdmin(user) || canManageCommission(user, data.commissionId);
  if (!allowed) return NextResponse.json({ error: "Fuera de tu jurisdicción" }, { status: 403 });

  const gym = await prisma.gym.create({
    data: {
      name: data.name,
      cityId: data.cityId,
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
      headCoach: data.headCoach || null,
      responsibleName: data.responsibleName || null,
      description: data.description || null,
      commissionId: data.commissionId || null
    }
  });

  await logAudit({ userId: user.id, action: "create", entityType: "Gym", entityId: gym.id, newValue: gym });

  return NextResponse.json(gym, { status: 201 });
}
