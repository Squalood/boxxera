import { prisma } from "@/lib/prisma";
import { GymForm } from "@/components/gyms/GymForm";

export default async function NewGymPage() {
  const [cities, commissions] = await Promise.all([
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    prisma.commission.findMany({ orderBy: { name: "asc" } })
  ]);
  return (
    <div>
      <h1 className="text-xl font-semibold text-white">Nuevo gimnasio</h1>
      <div className="mt-6">
        <GymForm cities={cities} commissions={commissions} />
      </div>
    </div>
  );
}
