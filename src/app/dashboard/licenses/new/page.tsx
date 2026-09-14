import { prisma } from "@/lib/prisma";
import { LicenseForm } from "@/components/licenses/LicenseForm";

export default async function NewLicensePage() {
  const [fighters, commissions] = await Promise.all([
    prisma.fighter.findMany({ orderBy: { publicName: "asc" } }),
    prisma.commission.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-white">Nueva licencia</h1>
      <div className="mt-6">
        <LicenseForm fighters={fighters} commissions={commissions} />
      </div>
    </div>
  );
}
