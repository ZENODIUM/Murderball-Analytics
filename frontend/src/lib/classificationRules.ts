/**
 * Centrally Maintained, Date-Aware Classification Legality Engine (TypeScript)
 * Implements official World Wheelchair Rugby (WWR) classification regulations across historical eras.
 */

export interface RulesEraConfig {
  id: string;
  name: string;
  baseCap: number;
  femaleAllowanceMode: "NONE" | "FLAT_0_5" | "TIERED_CLASS";
  description: string;
}

export const RULES_ERAS: Record<string, RulesEraConfig> = {
  ERA_PRE_2010: {
    id: "ERA_PRE_2010",
    name: "Historical Classical Era (Pre-2010: Athens 2004 & Beijing 2008)",
    baseCap: 8.0,
    femaleAllowanceMode: "NONE",
    description: "Strict 8.0 cap. No point modification for female athletes."
  },
  ERA_2010_2025: {
    id: "ERA_2010_2025",
    name: "Flat Allowance Era (2010-2025: London 2012, Rio 2016, Tokyo 2020, Paris 2024)",
    baseCap: 8.0,
    femaleAllowanceMode: "FLAT_0_5",
    description: "8.0 base cap + 0.5 points per female athlete on court."
  },
  ERA_2026_MODERN: {
    id: "ERA_2026_MODERN",
    name: "Tiered Modern Era (2026+: São Paulo 2026 World Championship & Beyond)",
    baseCap: 8.0,
    femaleAllowanceMode: "TIERED_CLASS",
    description: "8.0 base cap + 0.5 for female athletes 0.5-1.5; +1.0 for female athletes 2.0-3.5."
  }
};

export function determineRulesEra(dateOrYearOrEra?: number | string): string {
  if (!dateOrYearOrEra) return "ERA_2026_MODERN";

  if (typeof dateOrYearOrEra === "number") {
    if (dateOrYearOrEra < 2010) return "ERA_PRE_2010";
    if (dateOrYearOrEra <= 2025) return "ERA_2010_2025";
    return "ERA_2026_MODERN";
  }

  const str = String(dateOrYearOrEra).trim();
  if (RULES_ERAS[str]) return str;

  if (str.includes("Athens") || str.includes("2004") || str.includes("Beijing") || str.includes("2008")) {
    return "ERA_PRE_2010";
  }
  if (str.includes("London") || str.includes("2012") || str.includes("Rio") || str.includes("2016") || str.includes("Tokyo") || str.includes("2020") || str.includes("Paris") || str.includes("2024")) {
    return "ERA_2010_2025";
  }
  if (str.includes("2026") || str.includes("São Paulo") || str.includes("Sao Paulo") || str.includes("2028")) {
    return "ERA_2026_MODERN";
  }

  return "ERA_2026_MODERN";
}

export function getIndividualFemaleAllowance(classification: number, isFemale: boolean, eraId: string): number {
  if (!isFemale) return 0.0;
  const era = RULES_ERAS[eraId] || RULES_ERAS.ERA_2026_MODERN;

  if (era.femaleAllowanceMode === "NONE") return 0.0;
  if (era.femaleAllowanceMode === "FLAT_0_5") return 0.5;
  if (era.femaleAllowanceMode === "TIERED_CLASS") {
    return classification <= 1.5 ? 0.5 : 1.0;
  }
  return 0.0;
}

export interface LineupLegalityResult {
  isLegal: boolean;
  athleteCount: number;
  rawClassificationSum: number;
  baseCap: number;
  totalFemaleAllowance: number;
  effectiveCap: number;
  femaleCount: number;
  rulesEra: string;
  rulesEraName: string;
  description: string;
  disqualificationReasons: string[];
}

export function evaluateLineupLegality(
  athletes: Array<{ classification?: number; sportClass?: number; gender?: string; is_female?: boolean }>,
  dateOrEra?: number | string
): LineupLegalityResult {
  const eraId = determineRulesEra(dateOrEra);
  const era = RULES_ERAS[eraId] || RULES_ERAS.ERA_2026_MODERN;

  let rawSum = 0;
  let allowanceSum = 0;
  let femaleCount = 0;

  for (const a of athletes) {
    const c = a.classification ?? a.sportClass ?? 0;
    const isFem = Boolean(a.gender === "F" || a.is_female);
    const allow = getIndividualFemaleAllowance(c, isFem, eraId);

    if (isFem) {
      femaleCount++;
      allowanceSum += allow;
    }
    rawSum += c;
  }

  const effectiveCap = era.baseCap + allowanceSum;
  const countLegal = athletes.length === 4;
  const pointsLegal = rawSum <= effectiveCap + 1e-4;

  const reasons: string[] = [];
  if (!countLegal) reasons.push(`Lineup must contain exactly 4 athletes (found ${athletes.length})`);
  if (!pointsLegal) reasons.push(`Total points ${rawSum.toFixed(1)} exceeds effective cap ${effectiveCap.toFixed(1)} by ${(rawSum - effectiveCap).toFixed(1)} under ${era.name}`);

  return {
    isLegal: countLegal && pointsLegal,
    athleteCount: athletes.length,
    rawClassificationSum: Number(rawSum.toFixed(1)),
    baseCap: era.baseCap,
    totalFemaleAllowance: Number(allowanceSum.toFixed(1)),
    effectiveCap: Number(effectiveCap.toFixed(1)),
    femaleCount,
    rulesEra: eraId,
    rulesEraName: era.name,
    description: era.description,
    disqualificationReasons: reasons
  };
}
