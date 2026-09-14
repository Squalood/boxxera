import { prisma } from "@/lib/prisma";
import { OpportunityForm } from "@/components/opportunities/OpportunityForm";

export default async function NewOpportunityPage() {
  const [fighters, commissions] = await Promise.all([
    prisma.fighter.findMany({ where: { status: "ACTIVE" }, orderBy: { publicName: "asc" } }),
    prisma.commission.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-white">Nueva oportunidad de pelea</h1>
      <p className="mt-1 text-sm text-ink-400">
        El motor de matchmaking calcula los cuatro scores al crear la oportunidad.
      </p>
      <div className="mt-6">
        <OpportunityForm fighters={fighters} commissions={commissions} />
      </div>
    </div>
  );
}
