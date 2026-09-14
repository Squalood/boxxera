import { prisma } from "@/lib/prisma";
import { FighterForm } from "@/components/fighters/FighterForm";

export default async function NewFighterPage() {
  const [cities, commissions, gyms] = await Promise.all([
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    prisma.commission.findMany({ orderBy: { name: "asc" } }),
    prisma.gym.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-white">Nuevo boxeador</h1>
      <div className="mt-6">
        <FighterForm cities={cities} commissions={commissions} gyms={gyms} />
      </div>
    </div>
  );
}
