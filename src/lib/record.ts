import { prisma } from "@/lib/prisma";

/**
 * Recomputes a fighter's wins/losses/draws/koWins/totalFights from their
 * verified FightRecord rows. Called after any FightRecord create/update/delete
 * so the denormalized summary on Fighter never drifts from the source of truth.
 */
export async function recomputeFighterRecord(fighterId: string) {
  const fights = await prisma.fightRecord.findMany({
    where: { fighterId }
  });

  const wins = fights.filter((f) => f.result === "WIN").length;
  const losses = fights.filter((f) => f.result === "LOSS").length;
  const draws = fights.filter((f) => f.result === "DRAW").length;
  const koWins = fights.filter(
    (f) => f.result === "WIN" && (f.method === "KO" || f.method === "TKO")
  ).length;
  const totalFights = fights.filter((f) => f.result !== "NO_CONTEST").length;

  await prisma.fighter.update({
    where: { id: fighterId },
    data: { wins, losses, draws, koWins, totalFights }
  });
}
