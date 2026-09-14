import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isGlobalAdmin } from "@/lib/rbac";
import { Button } from "@/components/ui/Button";
import { VerifiedBadge, StatusBadge } from "@/components/ui/Badge";

export default async function FightersListPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const fighters = await prisma.fighter.findMany({
    where: isGlobalAdmin(user)
      ? {}
      : user.role === "COMMISSION_ADMIN"
      ? { commissionId: user.commissionId ?? "__none__" }
      : user.role === "GYM_ADMIN"
      ? { gymId: user.gymId ?? "__none__" }
      : { id: user.fighterId ?? "__none__" },
    include: { gym: true, commission: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Boxeadores</h1>
        <Link href="/dashboard/fighters/new">
          <Button>Nuevo boxeador</Button>
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre público</th>
              <th>Categoría</th>
              <th>Récord</th>
              <th>Gimnasio</th>
              <th>Comisión</th>
              <th>Estado</th>
              <th>Verificación</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {fighters.map((f) => (
              <tr key={f.id}>
                <td className="font-medium text-white">{f.publicName}</td>
                <td>{f.weightClass}</td>
                <td>{f.wins}-{f.losses}-{f.draws}</td>
                <td>{f.gym?.name ?? "—"}</td>
                <td>{f.commission?.shortName ?? "—"}</td>
                <td><StatusBadge status={f.status} /></td>
                <td><VerifiedBadge status={f.verificationStatus} /></td>
                <td>
                  <Link href={`/dashboard/fighters/${f.id}`} className="text-sm text-accent-400 hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {fighters.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-ink-500">Sin fighters registrados todavía.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
