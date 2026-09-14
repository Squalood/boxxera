import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isGlobalAdmin } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";

export default async function AuditLogPage() {
  const user = await getCurrentUser();
  if (!user || !isGlobalAdmin(user)) redirect("/dashboard");

  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-white">Audit log</h1>
      <p className="mt-1 text-sm text-ink-400">Últimos 200 cambios registrados en el sistema.</p>
      <div className="mt-6 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Entidad</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{formatDate(l.createdAt)}</td>
                <td>{l.user?.name ?? "—"}</td>
                <td>{l.action}</td>
                <td>{l.entityType}</td>
                <td className="text-ink-500">{l.entityId.slice(0, 10)}…</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="text-center text-ink-500">Sin actividad registrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
