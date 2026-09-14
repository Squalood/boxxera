import type { Fighter } from "@prisma/client";

/**
 * matchmakingEngine
 *
 * Scores a potential FightOpportunity across four dimensions. This is
 * DELIBERATELY orientative, not a sporting truth — see the brief: "No
 * pretender que esto sea una verdad deportiva absoluta." Every score ships
 * with the explanation that produced it, and the overall confidence is only
 * as high as its weakest input.
 *
 * Nothing here approves anything. It only recommends — a human still moves
 * the FightOpportunity through its status workflow.
 */

export type MatchmakingContext = {
  proposedCity?: string | null;
  // Optional commercial inputs — when missing, commercial score falls back
  // to a conservative default and dataConfidence drops to LOW-equivalent.
  fighterAFollowers?: number | null;
  fighterBFollowers?: number | null;
  localInterest?: "low" | "medium" | "high" | null;
  // Optional logistics inputs
  estimatedTravelCost?: number | null;
  estimatedHotelCost?: number | null;
  estimatedMedicalCost?: number | null;
  estimatedVenueCost?: number | null;
};

export type MatchmakingResult = {
  sportingScore: number;
  commercialScore: number;
  logisticsScore: number;
  economicScore: number;
  totalScore: number;
  dataConfidence: "CONFIRMED" | "ESTIMATED" | "ASSUMED" | "PROPOSED";
  estimatedCost: number;
  estimatedRevenue: number;
  estimatedProfit: number;
  explanation: {
    sporting: { score: number; reasons: string[] };
    commercial: { score: number; reasons: string[] };
    logistics: { score: number; reasons: string[] };
    economics: { score: number; projectedRevenue: number; projectedCost: number; projectedProfit: number; reasons: string[] };
    overall: { score: number; recommendation: "viable" | "marginal" | "not_recommended" };
  };
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function computeMatchmaking(
  fighterA: Fighter,
  fighterB: Fighter,
  ctx: MatchmakingContext = {}
): MatchmakingResult {
  // ---- SPORTING SCORE -------------------------------------------------------
  const sportingReasons: string[] = [];
  let sporting = 60;

  const sameWeight = fighterA.weightClass === fighterB.weightClass;
  if (sameWeight) {
    sporting += 15;
    sportingReasons.push("Misma categoría de peso");
  } else {
    sporting -= 20;
    sportingReasons.push("Categorías de peso distintas — requiere override");
  }

  const totalA = fighterA.totalFights;
  const totalB = fighterB.totalFights;
  const experienceGap = Math.abs(totalA - totalB);
  if (experienceGap <= 3) {
    sporting += 10;
    sportingReasons.push("Experiencia comparable (peleas totales)");
  } else if (experienceGap > 8) {
    sporting -= 15;
    sportingReasons.push("Brecha grande de experiencia");
  }

  const winRateA = totalA > 0 ? fighterA.wins / totalA : 0.5;
  const winRateB = totalB > 0 ? fighterB.wins / totalB : 0.5;
  const winRateGap = Math.abs(winRateA - winRateB);
  if (winRateGap < 0.15) {
    sporting += 10;
    sportingReasons.push("Récords de nivel similar");
  } else if (winRateGap > 0.4) {
    sporting -= 10;
    sportingReasons.push("Diferencia notable en récord");
  }

  if (fighterA.status === "ACTIVE" && fighterB.status === "ACTIVE") {
    sporting += 5;
    sportingReasons.push("Ambos boxeadores activos");
  } else {
    sporting -= 25;
    sportingReasons.push("Uno o ambos boxeadores no están activos");
  }

  const sportingScore = clamp(sporting);

  // ---- COMMERCIAL SCORE -------------------------------------------------------
  const commercialReasons: string[] = [];
  let commercial = 50;
  let hasCommercialData = false;

  if (ctx.fighterAFollowers != null || ctx.fighterBFollowers != null) {
    hasCommercialData = true;
    const combined = (ctx.fighterAFollowers ?? 0) + (ctx.fighterBFollowers ?? 0);
    if (combined > 50000) {
      commercial += 20;
      commercialReasons.push("Audiencia combinada alta");
    } else if (combined > 5000) {
      commercial += 8;
      commercialReasons.push("Audiencia combinada moderada");
    }
  } else {
    commercialReasons.push("Sin datos de audiencia — score conservador");
  }

  if (ctx.localInterest) {
    hasCommercialData = true;
    const bump = { low: -5, medium: 8, high: 18 }[ctx.localInterest];
    commercial += bump;
    commercialReasons.push(`Interés local: ${ctx.localInterest}`);
  }

  if (fighterA.cityId && fighterB.cityId && fighterA.cityId === fighterB.cityId) {
    commercial += 10;
    commercialReasons.push("Misma ciudad — rivalidad local potencial");
  }

  const commercialScore = clamp(commercial);

  // ---- LOGISTICS SCORE -------------------------------------------------------
  const logisticsReasons: string[] = [];
  let logistics = 70;

  const sameCity = fighterA.cityId && fighterB.cityId && fighterA.cityId === fighterB.cityId;
  if (sameCity) {
    logistics += 15;
    logisticsReasons.push("Ambos boxeadores en la misma ciudad — bajo costo de viaje");
  }

  if (fighterA.commissionId && fighterB.commissionId && fighterA.commissionId === fighterB.commissionId) {
    logistics += 10;
    logisticsReasons.push("Misma comisión — sin fricción de jurisdicción");
  } else if (fighterA.commissionId && fighterB.commissionId) {
    logistics -= 10;
    logisticsReasons.push("Comisiones distintas — requiere coordinación adicional");
  }

  const travelCost =
    (ctx.estimatedTravelCost ?? (sameCity ? 15000 : 60000)) +
    (ctx.estimatedHotelCost ?? (sameCity ? 0 : 25000));
  if (travelCost < 30000) {
    logistics += 5;
    logisticsReasons.push("Costo logístico estimado bajo");
  } else if (travelCost > 80000) {
    logistics -= 10;
    logisticsReasons.push("Costo logístico estimado alto");
  }

  const logisticsScore = clamp(logistics);

  // ---- ECONOMIC SCORE ---------------------------------------------------------
  const economicReasons: string[] = [];

  const estimatedVenueCost = ctx.estimatedVenueCost ?? 80000;
  const estimatedMedicalCost = ctx.estimatedMedicalCost ?? 15000;
  const estimatedPurseTotal = 40000 + (fighterA.wins + fighterB.wins) * 1500; // rough, ASSUMED
  const estimatedCost =
    estimatedPurseTotal + estimatedVenueCost + estimatedMedicalCost + travelCost;

  // Ticket + sponsorship potential scales loosely with the commercial score —
  // this is an ASSUMED starting point, not a forecast.
  const estimatedRevenue = Math.round(
    estimatedCost * (0.6 + (commercialScore / 100) * 1.1)
  );
  const estimatedProfit = estimatedRevenue - estimatedCost;

  economicReasons.push(
    estimatedProfit > 0
      ? "Utilidad proyectada positiva con los supuestos actuales"
      : "Utilidad proyectada negativa o marginal con los supuestos actuales"
  );
  if (!hasCommercialData) {
    economicReasons.push("Ingreso proyectado usa supuestos conservadores — falta dato comercial real");
  }

  const margin = estimatedRevenue > 0 ? estimatedProfit / estimatedRevenue : -1;
  let economic = 50 + margin * 100;
  economic = clamp(economic);

  // ---- OVERALL ----------------------------------------------------------------
  const totalScore = clamp(
    sportingScore * 0.3 + commercialScore * 0.25 + logisticsScore * 0.2 + economic * 0.25
  );

  const recommendation: "viable" | "marginal" | "not_recommended" =
    totalScore >= 75 && estimatedProfit > 0
      ? "viable"
      : totalScore >= 55
      ? "marginal"
      : "not_recommended";

  const dataConfidence: MatchmakingResult["dataConfidence"] = hasCommercialData
    ? "ESTIMATED"
    : "ASSUMED";

  return {
    sportingScore,
    commercialScore,
    logisticsScore,
    economicScore: economic,
    totalScore,
    dataConfidence,
    estimatedCost,
    estimatedRevenue,
    estimatedProfit,
    explanation: {
      sporting: { score: sportingScore, reasons: sportingReasons },
      commercial: { score: commercialScore, reasons: commercialReasons },
      logistics: { score: logisticsScore, reasons: logisticsReasons },
      economics: {
        score: economic,
        projectedRevenue: estimatedRevenue,
        projectedCost: estimatedCost,
        projectedProfit: estimatedProfit,
        reasons: economicReasons
      },
      overall: { score: totalScore, recommendation }
    }
  };
}
