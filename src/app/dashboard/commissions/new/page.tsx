import { prisma } from "@/lib/prisma";
import { CommissionForm } from "@/components/commissions/CommissionForm";

export default async function NewCommissionPage() {
  const cities = await prisma.city.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="text-xl font-semibold text-white">Nueva comisión</h1>
      <div className="mt-6">
        <CommissionForm cities={cities} />
      </div>
    </div>
  );
}
