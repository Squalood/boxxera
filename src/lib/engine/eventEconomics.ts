import { prisma } from "@/lib/prisma";

/**
 * eventEconomicsEngine
 *
 * Same principle as lib/record.ts: gross_profit and margin are NEVER stored
 * as standalone fields anyone can hand-edit — they are always derived from
 * EventCost/EventRevenue rows at read time. If a number ever looks wrong,
 * the bug is in this calculation, not in a manually-typed total.
 */

export type EventEconomics = {
  projectedRevenue: number;
  projectedCost: number;
  projectedProfit: number;
  confirmedRevenue: number;
  confirmedCost: number;
  actualProfit: number;
  margin: number | null; // null when projectedRevenue is 0 (undefined margin)
  breakEvenRevenue: number;
  remainingToBreakEven: number;
  status: "LOSING_MONEY" | "BREAK_EVEN" | "PROFITABLE";
  currency: string;
};

export async function computeEventEconomics(eventId: string): Promise<EventEconomics> {
  const [costs, revenues] = await Promise.all([
    prisma.eventCost.findMany({ where: { eventId } }),
    prisma.eventRevenue.findMany({ where: { eventId } })
  ]);

  const currency = costs[0]?.currency ?? revenues[0]?.currency ?? "MXN";

  // "Projected" = every planned line item regardless of status.
  // "Confirmed" = only what's actually PAID (cost) or RECEIVED (revenue) —
  // i.e. real money that has moved, not a plan.
  const projectedCost = sum(costs);
  const projectedRevenue = sum(revenues);
  const confirmedCost = sum(costs.filter((c) => c.status === "PAID"));
  const confirmedRevenue = sum(revenues.filter((r) => r.status === "RECEIVED"));

  const projectedProfit = projectedRevenue - projectedCost;
  const actualProfit = confirmedRevenue - confirmedCost;
  const margin = projectedRevenue > 0 ? projectedProfit / projectedRevenue : null;

  const breakEvenRevenue = projectedCost;
  const remainingToBreakEven = Math.max(0, breakEvenRevenue - confirmedRevenue);

  const status: EventEconomics["status"] =
    actualProfit > 0 ? "PROFITABLE" : actualProfit === 0 ? "BREAK_EVEN" : "LOSING_MONEY";

  return {
    projectedRevenue,
    projectedCost,
    projectedProfit,
    confirmedRevenue,
    confirmedCost,
    actualProfit,
    margin,
    breakEvenRevenue,
    remainingToBreakEven,
    status,
    currency
  };
}

function sum(rows: { amount: unknown }[]): number {
  return rows.reduce((acc, r) => acc + Number(r.amount), 0);
}
