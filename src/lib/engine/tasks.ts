import { prisma } from "@/lib/prisma";

/**
 * Creates the standard follow-up tasks when a FightOpportunity is approved.
 * This is automation that CREATES WORK ITEMS for a human — it never approves,
 * signs, or commits anything by itself (see brief section 20,
 * human-in-the-loop).
 */
export async function createTasksForApprovedOpportunity(opportunityId: string) {
  const categories: { category: string; title: string }[] = [
    { category: "commission", title: "Confirmar aprobación de comisión" },
    { category: "medical", title: "Programar revisión médica pre-pelea" },
    { category: "contract", title: "Redactar y firmar contrato de pelea" },
    { category: "venue", title: "Confirmar disponibilidad de sede" },
    { category: "sponsor", title: "Evaluar patrocinadores potenciales" },
    { category: "production", title: "Iniciar presupuesto de producción" }
  ];

  await prisma.task.createMany({
    data: categories.map((c) => ({
      opportunityId,
      category: c.category,
      title: c.title,
      status: "OPEN"
    }))
  });
}
