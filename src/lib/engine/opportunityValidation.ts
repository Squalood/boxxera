import { prisma } from "@/lib/prisma";
import type { Fighter } from "@prisma/client";

export type ValidationIssue = { code: string; message: string; blocking: boolean };

/**
 * Validation rules for a proposed FightOpportunity. Returns a list of issues;
 * the caller decides whether "blocking" issues stop creation (they do, by
 * default) or an authorized override is required. Kept as plain data (not
 * exceptions) so the UI can show every issue at once, not just the first.
 */
export async function validateOpportunity(
  fighterA: Fighter,
  fighterB: Fighter,
  opts: { proposedDate?: Date | null; allowOverride?: boolean } = {}
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  if (fighterA.id === fighterB.id) {
    issues.push({ code: "SELF_MATCH", message: "Un boxeador no puede pelear contra sí mismo.", blocking: true });
    return issues; // nothing else is worth checking after this
  }

  if (fighterA.weightClass !== fighterB.weightClass) {
    issues.push({
      code: "WEIGHT_MISMATCH",
      message: `Categorías distintas (${fighterA.weightClass} vs. ${fighterB.weightClass}).`,
      blocking: !opts.allowOverride
    });
  }

  if (fighterA.status !== "ACTIVE" || fighterB.status !== "ACTIVE") {
    issues.push({
      code: "INACTIVE_FIGHTER",
      message: "Uno o ambos boxeadores no están en estado ACTIVE.",
      blocking: true
    });
  }

  // Licenses: only checked when the fighter has at least one on record —
  // absence of a license row is a data gap, not by itself a blocker, but an
  // EXPIRED/SUSPENDED/REVOKED active-type license is.
  const [licensesA, licensesB] = await Promise.all([
    prisma.license.findMany({ where: { fighterId: fighterA.id }, orderBy: { issuedAt: "desc" } }),
    prisma.license.findMany({ where: { fighterId: fighterB.id }, orderBy: { issuedAt: "desc" } })
  ]);
  for (const [label, licenses] of [["A", licensesA], ["B", licensesB]] as const) {
    const latest = licenses[0];
    if (latest && latest.status !== "ACTIVE") {
      issues.push({
        code: "LICENSE_NOT_ACTIVE",
        message: `Boxeador ${label}: licencia más reciente en estado ${latest.status}.`,
        blocking: latest.status === "EXPIRED" || latest.status === "SUSPENDED" || latest.status === "REVOKED"
      });
    }
  }

  if (fighterA.commissionId && fighterB.commissionId && fighterA.commissionId !== fighterB.commissionId) {
    issues.push({
      code: "JURISDICTION_MISMATCH",
      message: "Los boxeadores pertenecen a comisiones distintas — requiere coordinación entre jurisdicciones.",
      blocking: false
    });
  }

  // Duplicate recent matchup — same pair proposed/negotiated in the last 180 days.
  const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 180);
  const recentDuplicate = await prisma.fightOpportunity.findFirst({
    where: {
      status: { notIn: ["REJECTED", "CANCELLED"] },
      createdAt: { gte: cutoff },
      OR: [
        { fighterAId: fighterA.id, fighterBId: fighterB.id },
        { fighterAId: fighterB.id, fighterBId: fighterA.id }
      ]
    }
  });
  if (recentDuplicate) {
    issues.push({
      code: "DUPLICATE_MATCHUP",
      message: "Ya existe una oportunidad reciente entre estos dos boxeadores.",
      blocking: !opts.allowOverride
    });
  }

  if (opts.proposedDate && opts.proposedDate < new Date()) {
    issues.push({ code: "DATE_IN_PAST", message: "La fecha propuesta ya pasó.", blocking: true });
  }

  return issues;
}

export function hasBlockingIssues(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.blocking);
}
