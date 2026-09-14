import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public, no-login "quiero ser miembro" form. Does not create a
 * BoxerMembership directly — a fighter record (and its unique membership)
 * only exists once the gym/commission has done the intake. This just opens
 * a task for the BOXXERA team to follow up and link the person to their
 * Fighter profile, matching the current onboarding flow.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name: string | undefined = body.name?.trim();
  const phone: string | undefined = body.phone?.trim();
  const city: string | undefined = body.city?.trim();
  const gymName: string | undefined = body.gymName?.trim();
  const consent: boolean = !!body.consent;
  // Honeypot: a real visitor never fills this hidden field. Any bot that
  // fills every field blindly gets silently accepted-but-discarded, so it
  // doesn't learn the field is a trap.
  const honeypot: string | undefined = body.website?.trim();

  if (!name || !phone) {
    return NextResponse.json({ error: "Nombre y teléfono son requeridos." }, { status: 400 });
  }
  if (name.length > 200 || phone.length > 40 || (city && city.length > 200) || (gymName && gymName.length > 200)) {
    return NextResponse.json({ error: "Uno de los campos es demasiado largo." }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json(
      { error: "Necesitamos tu consentimiento para que BOXXERA te contacte." },
      { status: 400 }
    );
  }
  if (honeypot) {
    // Pretend success so the bot doesn't retry with different payloads.
    return NextResponse.json({ ok: true, taskId: "discarded" }, { status: 201 });
  }

  const task = await prisma.task.create({
    data: {
      title: `Nuevo interesado en membresía BOXXERA: ${name}`,
      category: "membership",
      status: "OPEN",
      // TODO (deuda técnica documentada en README): esto guarda los datos
      // del interesado en un campo de texto libre porque crear un modelo
      // MembershipLead dedicado quedó fuera de alcance de esta fase. Si el
      // volumen de interesados crece, vale la pena esa entidad estructurada.
      notes: [
        `Teléfono: ${phone}`,
        city ? `Ciudad: ${city}` : null,
        gymName ? `Gimnasio: ${gymName}` : null,
        "Consentimiento de contacto: sí"
      ]
        .filter(Boolean)
        .join(" · ")
    }
  });

  return NextResponse.json({ ok: true, taskId: task.id }, { status: 201 });
}
