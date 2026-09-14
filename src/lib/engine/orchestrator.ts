import { prisma } from "@/lib/prisma";
import { computeEventEconomics } from "@/lib/engine/eventEconomics";

/**
 * BOXXERA Orchestrator
 *
 * Deterministic and auditable — every recommendation is a direct read of
 * real rows plus a fixed threshold, never a generative guess. Nothing here
 * approves, contacts, or commits anything; it only tells the team what
 * needs attention right now. `supportingData` always carries the exact
 * numbers used so the recommendation is checkable against the source.
 */

export type RecommendationType =
  | "SPORTING"
  | "COMMERCIAL"
  | "FINANCIAL"
  | "REGULATORY"
  | "MEDICAL"
  | "LEGAL"
  | "OPERATIONAL"
  | "SPONSORSHIP"
  | "MEMBERSHIP";

export type Severity = "INFO" | "OPPORTUNITY" | "WARNING" | "CRITICAL";

export type Recommendation = {
  type: RecommendationType;
  severity: Severity;
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  supportingData?: Record<string, unknown>;
  suggestedAction?: string;
};

const THIRTY_DAYS = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
const HIGH_SCORE_THRESHOLD = 75;
const HIGH_VOTE_THRESHOLD = 10;

export async function generateFightRecommendations(): Promise<Recommendation[]> {
  const opportunities = await prisma.fightOpportunity.findMany({
    where: { status: { in: ["DISCOVERED", "SUGGESTED", "CONTACTING", "NEGOTIATING"] } },
    include: { fighterA: true, fighterB: true, votes: true }
  });

  const out: Recommendation[] = [];
  for (const o of opportunities) {
    const label = `${o.fighterA.publicName} vs. ${o.fighterB.publicName}`;
    const voteCount = o.votes.length;

    if ((o.totalScore ?? 0) >= HIGH_SCORE_THRESHOLD && voteCount >= HIGH_VOTE_THRESHOLD) {
      out.push({
        type: "SPORTING",
        severity: "OPPORTUNITY",
        title: `${label} tiene alta compatibilidad y demanda`,
        description: `Score total ${o.totalScore}, ${voteCount} votos del público.`,
        entityType: "FightOpportunity",
        entityId: o.id,
        supportingData: { totalScore: o.totalScore, voteCount },
        suggestedAction: "Mover a negociación"
      });
    } else if (o.status === "SUGGESTED") {
      out.push({
        type: "OPERATIONAL",
        severity: "INFO",
        title: `${label} está lista para contactar`,
        description: "Ya fue evaluada por el matchmaking y sigue en Sugerida.",
        entityType: "FightOpportunity",
        entityId: o.id,
        suggestedAction: "Iniciar contacto"
      });
    }

    if (voteCount >= HIGH_VOTE_THRESHOLD) {
      const hasSponsor = await prisma.sponsorship.findFirst({
        where: { OR: [{ fighterId: o.fighterAId }, { fighterId: o.fighterBId }], status: { not: "LOST" } }
      });
      if (!hasSponsor) {
        out.push({
          type: "SPONSORSHIP",
          severity: "OPPORTUNITY",
          title: `${label} tiene demanda pero todavía no tiene sponsor`,
          description: `${voteCount} votos del público sin patrocinio asociado.`,
          entityType: "FightOpportunity",
          entityId: o.id,
          supportingData: { voteCount },
          suggestedAction: "Buscar patrocinador"
        });
      }
    }

    if ((o.economicScore ?? 100) < 40 && (o.commercialScore ?? 0) >= 60) {
      out.push({
        type: "FINANCIAL",
        severity: "WARNING",
        title: `${label} tiene buen interés comercial pero mala economía`,
        description: `Comercial ${o.commercialScore}, económico ${o.economicScore}.`,
        entityType: "FightOpportunity",
        entityId: o.id,
        supportingData: { commercialScore: o.commercialScore, economicScore: o.economicScore }
      });
    }
  }
  return out;
}

export async function generateEventRecommendations(eventId: string): Promise<Recommendation[]> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { fights: { include: { fighterA: true, fighterB: true } } }
  });
  if (!event) return [];

  const economics = await computeEventEconomics(eventId);
  const out: Recommendation[] = [];

  if (economics.remainingToBreakEven > 0) {
    out.push({
      type: "FINANCIAL",
      severity: economics.remainingToBreakEven > economics.projectedRevenue * 0.5 ? "CRITICAL" : "WARNING",
      title: `${event.name} está a $${economics.remainingToBreakEven.toLocaleString("es-MX")} de break-even`,
      description: "Calculado de ingresos confirmados vs. costo proyectado total.",
      entityType: "Event",
      entityId: event.id,
      supportingData: economics
    });
  }

  for (const f of event.fights) {
    const label = `${f.fighterA.publicName} vs. ${f.fighterB.publicName}`;
    if (f.medicalStatus === "PENDING") {
      out.push({
        type: "MEDICAL",
        severity: "WARNING",
        title: `Falta autorización médica — ${label}`,
        description: "La revisión médica pre-pelea sigue pendiente.",
        entityType: "Fight",
        entityId: f.id
      });
    }
    if (f.contractStatus === "PENDING") {
      out.push({
        type: "REGULATORY",
        severity: "WARNING",
        title: `Falta contrato — ${label}`,
        description: "El contrato de pelea no está firmado todavía.",
        entityType: "Fight",
        entityId: f.id
      });
    }
    if (f.commissionStatus === "PENDING") {
      out.push({
        type: "REGULATORY",
        severity: "WARNING",
        title: `Falta aprobación de comisión — ${label}`,
        description: "La comisión no ha aprobado esta pelea todavía.",
        entityType: "Fight",
        entityId: f.id
      });
    }
  }
  return out;
}

export async function generateOperationalAlerts(): Promise<Recommendation[]> {
  const expiring = await prisma.license.findMany({
    where: { status: "ACTIVE", expiresAt: { lte: THIRTY_DAYS } },
    include: { fighter: true }
  });
  return expiring.map((l) => ({
    type: "OPERATIONAL",
    severity: "WARNING",
    title: `Licencia próxima a vencer — ${l.fighter.publicName}`,
    description: `Vence ${l.expiresAt?.toLocaleDateString("es-MX")}.`,
    entityType: "License",
    entityId: l.id,
    supportingData: { expiresAt: l.expiresAt }
  }));
}

export async function generateMembershipAlerts(): Promise<Recommendation[]> {
  const memberships = await prisma.boxerMembership.findMany({
    where: { OR: [{ status: "PAST_DUE" }, { status: "PENDING" }] },
    include: { fighter: true }
  });
  return memberships.map((m) => ({
    type: "MEMBERSHIP",
    severity: m.status === "PAST_DUE" ? "WARNING" : "INFO",
    title:
      m.status === "PAST_DUE"
        ? `Membresía atrasada — ${m.fighter.publicName}`
        : `Membresía pendiente de activar — ${m.fighter.publicName}`,
    description: `Estado: ${m.status} · pago: ${m.paymentStatus}`,
    entityType: "BoxerMembership",
    entityId: m.id
  }));
}

export async function generateMedicalSupportAlerts(): Promise<Recommendation[]> {
  const tasks = await prisma.task.findMany({
    where: { category: "medical", status: { in: ["OPEN", "IN_PROGRESS"] } },
    include: { fighter: true }
  });
  return tasks.map((t) => ({
    type: "MEDICAL",
    severity: "WARNING",
    title: `Solicitud médica pendiente — ${t.fighter?.publicName ?? "boxeador"}`,
    description: t.title,
    entityType: "Task",
    entityId: t.id
  }));
}

export async function generateLegalSupportAlerts(): Promise<Recommendation[]> {
  const tasks = await prisma.task.findMany({
    where: { category: "legal", status: { in: ["OPEN", "IN_PROGRESS"] } },
    include: { fighter: true }
  });
  return tasks.map((t) => ({
    type: "LEGAL",
    severity: "INFO",
    title: `Solicitud legal pendiente — ${t.fighter?.publicName ?? "boxeador"}`,
    description: t.title,
    entityType: "Task",
    entityId: t.id
  }));
}

export async function generateSponsorOpportunities(): Promise<Recommendation[]> {
  const interested = await prisma.sponsorship.findMany({
    where: { status: "INTERESTED" },
    include: { sponsor: true }
  });
  return interested.map((s) => ({
    type: "SPONSORSHIP",
    severity: "OPPORTUNITY",
    title: `${s.sponsor.companyName} requiere seguimiento`,
    description: `Marcó interés en "${s.program}" — falta que BOXXERA los contacte.`,
    entityType: "Sponsorship",
    entityId: s.id
  }));
}

/** Everything together, for the Command Center's "Acciones prioritarias". */
export async function generateAllRecommendations(): Promise<Recommendation[]> {
  const [fights, operational, memberships, medical, legal, sponsors] = await Promise.all([
    generateFightRecommendations(),
    generateOperationalAlerts(),
    generateMembershipAlerts(),
    generateMedicalSupportAlerts(),
    generateLegalSupportAlerts(),
    generateSponsorOpportunities()
  ]);
  const severityOrder: Record<Severity, number> = { CRITICAL: 0, WARNING: 1, OPPORTUNITY: 2, INFO: 3 };
  return [...fights, ...operational, ...memberships, ...medical, ...legal, ...sponsors].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}
