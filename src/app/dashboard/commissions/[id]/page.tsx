import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CommissionForm } from "@/components/commissions/CommissionForm";

export default async function EditCommissionPage({ params }: { params: { id: string } }) {
  const [commission, cities] = await Promise.all([
    prisma.commission.findUnique({ where: { id: params.id } }),
    prisma.city.findMany({ orderBy: { name: "asc" } })
  ]);
  if (!commission) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold text-white">{commission.name}</h1>
      <div className="mt-6">
        <CommissionForm
          commissionId={commission.id}
          cities={cities}
          initial={{
            name: commission.name,
            shortName: commission.shortName ?? "",
            cityId: commission.cityId,
            jurisdiction: commission.jurisdiction ?? "",
            contactEmail: commission.contactEmail ?? "",
            contactPhone: commission.contactPhone ?? ""
          }}
        />
      </div>
    </div>
  );
}
