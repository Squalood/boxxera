import { prisma } from "@/lib/prisma";

/**
 * The public vote is a real demand signal for `commercialScore` — it never
 * approves or converts anything by itself (see human-in-the-loop rule). It
 * only makes the existing commercial score reflect actual public interest
 * instead of the ASSUMED default the matchmaking engine starts with.
 *
 * Formula is intentionally simple and capped: 2 points per vote, up to +25,
 * added on top of the ORIGINAL commercial score computed at creation time
 * (stored in explanation.commercial.score so it never compounds on itself).
 */
export async function recalculateFromVotes(opportunityId: string) {
  const [opportunity, voteCount] = await Promise.all([
    prisma.fightOpportunity.findUnique({ where: { id: opportunityId } }),
    prisma.opportunityVote.count({ where: { opportunityId } })
  ]);
  if (!opportunity) return null;

  const explanation = (opportunity.explanation as any) ?? {};
  const baseCommercial: number = explanation?.commercial?.score ?? opportunity.commercialScore ?? 50;

  const voteBoost = Math.min(25, voteCount * 2);
  const commercialScore = Math.max(0, Math.min(100, baseCommercial + voteBoost));

  const sportingScore = opportunity.sportingScore ?? 0;
  const logisticsScore = opportunity.logisticsScore ?? 0;
  const economicScore = opportunity.economicScore ?? 0;
  const totalScore = Math.round(
    sportingScore * 0.3 + commercialScore * 0.25 + logisticsScore * 0.2 + economicScore * 0.25
  );

  const updated = await prisma.fightOpportunity.update({
    where: { id: opportunityId },
    data: {
      commercialScore,
      totalScore,
      explanation: {
        ...explanation,
        commercial: {
          score: commercialScore,
          reasons: [
            ...(explanation?.commercial?.reasons ?? []),
            `+${voteBoost} por ${voteCount} voto(s) del público`
          ].slice(-4) // keep it short, don't grow forever
        }
      } as any
    }
  });

  return { updated, voteCount };
}
