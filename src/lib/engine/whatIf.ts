import type { EventEconomics } from "@/lib/engine/eventEconomics";

/**
 * whatIfEngine
 *
 * Takes the current projected economics plus a set of overrides and returns
 * a recalculated scenario. Pure function — never writes to the database.
 * "BASE" is just the unmodified current projection.
 */

export type WhatIfOverrides = {
  ticketPriceDelta?: number; // absolute change, e.g. +50 MXN per ticket
  ticketCountSold?: number; // override assumed tickets sold
  attendanceOverride?: number;
  additionalSponsorRevenue?: number;
  purseDelta?: number; // absolute change to total purse cost
  venueDelta?: number;
  productionDelta?: number;
  travelDelta?: number;
  otherCostDelta?: number;
  otherRevenueDelta?: number;
};

export type WhatIfScenario = {
  label: "BASE" | "OPTIMISTIC" | "CONSERVATIVE" | "CUSTOM";
  revenue: number;
  cost: number;
  profit: number;
  margin: number | null;
};

export function runWhatIf(
  base: EventEconomics,
  overrides: WhatIfOverrides,
  label: WhatIfScenario["label"] = "CUSTOM"
): WhatIfScenario {
  const ticketDelta =
    (overrides.ticketPriceDelta ?? 0) * (overrides.ticketCountSold ?? 0);

  const revenue =
    base.projectedRevenue +
    ticketDelta +
    (overrides.additionalSponsorRevenue ?? 0) +
    (overrides.otherRevenueDelta ?? 0);

  const cost =
    base.projectedCost +
    (overrides.purseDelta ?? 0) +
    (overrides.venueDelta ?? 0) +
    (overrides.productionDelta ?? 0) +
    (overrides.travelDelta ?? 0) +
    (overrides.otherCostDelta ?? 0);

  const profit = revenue - cost;
  const margin = revenue > 0 ? profit / revenue : null;

  return { label, revenue, cost, profit, margin };
}

/** Convenience presets matching the brief's BASE/OPTIMISTIC/CONSERVATIVE labels. */
export function standardScenarios(base: EventEconomics): WhatIfScenario[] {
  return [
    runWhatIf(base, {}, "BASE"),
    runWhatIf(
      base,
      { additionalSponsorRevenue: base.projectedRevenue * 0.15, otherRevenueDelta: base.projectedRevenue * 0.05 },
      "OPTIMISTIC"
    ),
    runWhatIf(base, { otherRevenueDelta: -base.projectedRevenue * 0.15 }, "CONSERVATIVE")
  ];
}
