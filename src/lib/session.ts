import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { SessionUser } from "@/lib/rbac";

/** Server-side helper: returns the typed BOXXERA session user, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const u = session.user as any;
  return {
    id: u.id,
    role: u.role,
    commissionId: u.commissionId,
    gymId: u.gymId,
    fighterId: u.fighterId,
    sponsorId: u.sponsorId
  };
}
