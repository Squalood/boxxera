import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export default async function LicensesListPage() {
  const licenses = await prisma.license.findMany({
    include: { fighter: true, commission: true },
    orderBy: { expiresAt: "asc" }
  });

  const thirtyDays = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Licenses</h1>
        <Link href="/dashboard/licenses/new"><Button>Nueva licencia</Button></Link>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fighter</th>
              <th>Comisión</th>
              <th>Tipo</th>
              <th>N° licencia</th>
              <th>Emitida</th>
              <th>Vence</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((l) => {
              const expiringSoon = l.expiresAt && l.expiresAt <= thirtyDays && l.status === "ACTIVE";
              return (
                <tr key={l.id} className={expiringSoon ? "bg-amber-500/5" : ""}>
                  <td className="font-medium text-white">{l.fighter.publicName}</td>
                  <td>{l.commission.shortName ?? l.commission.name}</td>
                  <td>{l.type}</td>
                  <td>{l.licenseNumber}</td>
                  <td>{formatDate(l.issuedAt)}</td>
                  <td className={expiringSoon ? "text-amber-400" : ""}>{formatDate(l.expiresAt)}</td>
                  <td><StatusBadge status={l.status} /></td>
                </tr>
              );
            })}
            {licenses.length === 0 && (
              <tr><td colSpan={7} className="text-center text-ink-500">Sin licencias registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
