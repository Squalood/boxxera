import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { canManageMembership } from "@/lib/rbac";
import { MembershipControls } from "@/components/memberships/MembershipControls";
import { formatDate } from "@/lib/utils";

export default async function MembershipsPage() {
  const user = await getCurrentUser();
  if (!user || !canManageMembership(user)) redirect("/dashboard");

  const memberships = await prisma.boxerMembership.findMany({
    where: user.role === "COMMISSION_ADMIN" ? { fighter: { commissionId: user.commissionId ?? "__none__" } } : {},
    include: { fighter: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-white">Membresías</h1>
      <p className="mt-1 text-sm text-ink-400">
        Membresía simbólica del boxeador — no es el motor financiero principal de BOXXERA.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Boxeador</th>
              <th>Precio</th>
              <th>Renovación</th>
              <th>Último pago</th>
              <th>Estado / pago</th>
            </tr>
          </thead>
          <tbody>
            {memberships.map((m) => (
              <tr key={m.id}>
                <td className="font-medium text-white">{m.fighter.publicName}</td>
                <td>${Number(m.monthlyPrice).toLocaleString("es-MX")} {m.currency}</td>
                <td>{formatDate(m.renewalDate)}</td>
                <td>{formatDate(m.lastPaymentDate)}</td>
                <td><MembershipControls membershipId={m.id} status={m.status} paymentStatus={m.paymentStatus} /></td>
              </tr>
            ))}
            {memberships.length === 0 && (
              <tr><td colSpan={5} className="text-center text-ink-500">Sin membresías registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
