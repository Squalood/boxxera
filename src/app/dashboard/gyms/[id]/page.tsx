import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GymForm } from "@/components/gyms/GymForm";

export default async function EditGymPage({ params }: { params: { id: string } }) {
  const [gym, cities, commissions] = await Promise.all([
    prisma.gym.findUnique({ where: { id: params.id }, include: { fighters: true } }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    prisma.commission.findMany({ orderBy: { name: "asc" } })
  ]);
  if (!gym) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold text-white">{gym.name}</h1>
      <p className="text-sm text-ink-400">{gym.fighters.length} boxeadores en este gimnasio</p>
      <div className="mt-6">
        <GymForm
          gymId={gym.id}
          cities={cities}
          commissions={commissions}
          initial={{
            name: gym.name,
            cityId: gym.cityId,
            address: gym.address ?? "",
            phone: gym.phone ?? "",
            email: gym.email ?? "",
            headCoach: gym.headCoach ?? "",
            responsibleName: gym.responsibleName ?? "",
            description: gym.description ?? "",
            commissionId: gym.commissionId ?? ""
          }}
        />
      </div>
    </div>
  );
}
