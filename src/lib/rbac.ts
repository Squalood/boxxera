import { Role } from "@prisma/client";

/**
 * BOXXERA RBAC
 *
 * Two dimensions matter for every check:
 *  1. Role       — what kind of actor is this (admin, commission, gym, fighter...)
 *  2. Scope      — which jurisdiction/gym/fighter record they're allowed to touch
 *
 * A COMMISSION_ADMIN for Ciudad Juárez must never be able to edit a fighter,
 * license, or ranking that belongs to a different commission (e.g. Tijuana).
 * That scoping is enforced here, not left to each API route to remember.
 */

export type SessionUser = {
  id: string;
  role: Role;
  commissionId?: string | null;
  gymId?: string | null;
  fighterId?: string | null;
  sponsorId?: string | null;
};

const GLOBAL_ROLES: Role[] = ["SUPER_ADMIN", "BOXERA_ADMIN"];

export function isGlobalAdmin(user: SessionUser | null | undefined): boolean {
  if (!user) return false;
  return GLOBAL_ROLES.includes(user.role);
}

/** Can this user manage (create/edit/verify) fighters in the given commission? */
export function canManageCommission(
  user: SessionUser | null | undefined,
  commissionId?: string | null
): boolean {
  if (!user) return false;
  if (isGlobalAdmin(user)) return true;
  if (user.role === "COMMISSION_ADMIN") {
    return !!commissionId && user.commissionId === commissionId;
  }
  return false;
}

/** Can this user manage the given gym's roster? */
export function canManageGym(
  user: SessionUser | null | undefined,
  gymId?: string | null
): boolean {
  if (!user) return false;
  if (isGlobalAdmin(user)) return true;
  if (user.role === "GYM_ADMIN") {
    return !!gymId && user.gymId === gymId;
  }
  return false;
}

/** Can this user edit this specific fighter record? */
export function canManageFighter(
  user: SessionUser | null | undefined,
  fighter: { commissionId?: string | null; gymId?: string | null; id: string }
): boolean {
  if (!user) return false;
  if (isGlobalAdmin(user)) return true;
  if (canManageCommission(user, fighter.commissionId)) return true;
  if (canManageGym(user, fighter.gymId)) return true;
  if (user.role === "FIGHTER") return user.fighterId === fighter.id;
  return false;
}

/** Only global admins and the owning commission may verify records. */
export function canVerify(
  user: SessionUser | null | undefined,
  commissionId?: string | null
): boolean {
  if (!user) return false;
  if (isGlobalAdmin(user)) return true;
  return canManageCommission(user, commissionId);
}

export function requireRole(
  user: SessionUser | null | undefined,
  allowed: Role[]
): boolean {
  if (!user) return false;
  return allowed.includes(user.role);
}

// --- Fight & Event Engine ----------------------------------------------------

export function isPromoter(user: SessionUser | null | undefined): boolean {
  return !!user && user.role === "PROMOTER";
}

/**
 * A FightOpportunity can be managed by: whoever created it, a global admin,
 * or the commission admin of its jurisdiction. A promoter who did NOT create
 * it can still view (opportunities are visible to promoters by design) but
 * not edit/approve — approval is reserved for commission/global admins per
 * the human-in-the-loop rule (see engine docs).
 */
export function canManageOpportunity(
  user: SessionUser | null | undefined,
  opportunity: { createdById?: string | null; commissionId?: string | null }
): boolean {
  if (!user) return false;
  if (isGlobalAdmin(user)) return true;
  if (canManageCommission(user, opportunity.commissionId)) return true;
  if (isPromoter(user) && opportunity.createdById === user.id) return true;
  return false;
}

/** Only a commission admin (of that jurisdiction) or a global admin may approve/reject. */
export function canApproveOpportunity(
  user: SessionUser | null | undefined,
  opportunity: { commissionId?: string | null }
): boolean {
  if (!user) return false;
  if (isGlobalAdmin(user)) return true;
  return canManageCommission(user, opportunity.commissionId);
}

/** An event can be managed by its promoter, a global admin, or the event's commission. */
export function canManageEvent(
  user: SessionUser | null | undefined,
  event: { promoterId?: string | null; commissionId?: string | null }
): boolean {
  if (!user) return false;
  if (isGlobalAdmin(user)) return true;
  if (canManageCommission(user, event.commissionId)) return true;
  if (isPromoter(user) && event.promoterId === user.id) return true;
  return false;
}

// --- Membership & Sponsor management ----------------------------------------

/** Memberships are billing/administration — global admin or the commission
 * only (not gyms, not the fighter themselves — they can only view their own). */
export function canManageMembership(user: SessionUser | null | undefined): boolean {
  if (!user) return false;
  return isGlobalAdmin(user) || user.role === "COMMISSION_ADMIN";
}

export function isSponsorUser(user: SessionUser | null | undefined): boolean {
  return !!user && user.role === "SPONSOR";
}

/** A sponsorship is managed by BOXXERA staff (global admin) or the specific
 * sponsor it belongs to (read/express-interest only, not full edit). */
export function canManageSponsorship(user: SessionUser | null | undefined): boolean {
  if (!user) return false;
  return isGlobalAdmin(user);
}
