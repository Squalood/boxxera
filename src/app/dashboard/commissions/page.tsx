import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";

export default async function CommissionsListPage() {
  const commissions = await prisma.commission.findMany({
    include: { city: true, _count: { select: { fighters: true, gyms: true } } },
    orderBy: { name: "asc" }
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Commissions</h1>
        <Link href="/dashboard/commissions/new"><Button>Nueva comisión</Button></Link>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Ciudad</th>
              <th>Jurisdicción</th>
              <th>Boxeadores</th>
              <th>Gimnasios</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {commissions.map((c) => (
              <tr key={c.id}>
                <td className="font-medium text-white">{c.name} {c.shortName ? `(${c.shortName})` : ""}</td>
                <td>{c.city.name}</td>
                <td>{c.jurisdiction ?? "—"}</td>
                <td>{c._count.fighters}</td>
                <td>{c._count.gyms}</td>
                <td><Link href={`/dashboard/commissions/${c.id}`} className="text-sm text-accent-400 hover:underline">Editar</Link></td>
              </tr>
            ))}
            {commissions.length === 0 && (
              <tr><td colSpan={6} className="text-center text-ink-500">Sin comisiones registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
