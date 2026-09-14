import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";

export default async function GymsListPage() {
  const gyms = await prisma.gym.findMany({
    include: { city: true, commission: true, _count: { select: { fighters: true } } },
    orderBy: { name: "asc" }
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Gyms</h1>
        <Link href="/dashboard/gyms/new"><Button>Nuevo gimnasio</Button></Link>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Ciudad</th>
              <th>Comisión</th>
              <th>Boxeadores</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {gyms.map((g) => (
              <tr key={g.id}>
                <td className="font-medium text-white">{g.name}</td>
                <td>{g.city.name}</td>
                <td>{g.commission?.shortName ?? g.commission?.name ?? "—"}</td>
                <td>{g._count.fighters}</td>
                <td><StatusBadge status={g.status} /></td>
                <td><Link href={`/dashboard/gyms/${g.id}`} className="text-sm text-accent-400 hover:underline">Editar</Link></td>
              </tr>
            ))}
            {gyms.length === 0 && (
              <tr><td colSpan={6} className="text-center text-ink-500">Sin gimnasios registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
