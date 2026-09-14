import { prisma } from "@/lib/prisma";
import { RankingForm } from "@/components/rankings/RankingForm";

export default async function NewRankingPage() {
  const commissions = await prisma.commission.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="text-xl font-semibold text-white">Nuevo ranking</h1>
      <div className="mt-6">
        <RankingForm commissions={commissions} />
      </div>
    </div>
  );
}
