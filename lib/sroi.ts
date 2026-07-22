import { OUTCOME_TYPES, OutcomeType, OUTCOME_KEYS } from "./constants";

export type OutcomeRecord = {
  type: string;
  rawValue: number;
  attribution: number;
};

/** Standardized value = raw financial proxy x attribution % (SROI deadweight). */
export function standardizedValue(o: OutcomeRecord): number {
  return (o.rawValue * o.attribution) / 100;
}

export type LedgerRollup = {
  count: number;
  totalValue: number;
  sroi: number; // dollars returned per $1 invested
  costPerOutcome: number;
  byType: Record<string, number>;
};

/** The roll-up a community hands its sponsors: total economic value + SROI + cost/outcome. */
export function computeLedger(outcomes: OutcomeRecord[], programCost: number): LedgerRollup {
  const totalValue = outcomes.reduce((s, o) => s + standardizedValue(o), 0);
  const count = outcomes.length;
  const byType: Record<string, number> = {};
  for (const o of outcomes) byType[o.type] = (byType[o.type] ?? 0) + 1;
  return {
    count,
    totalValue,
    sroi: programCost > 0 ? totalValue / programCost : 0,
    costPerOutcome: count > 0 ? programCost / count : 0,
    byType,
  };
}

export function defaultAttribution(type: string): number {
  return (OUTCOME_TYPES as Record<string, { attr: number }>)[type]?.attr ?? 20;
}

export function isOutcomeType(t: string): t is OutcomeType {
  return OUTCOME_KEYS.includes(t as OutcomeType);
}

export function money(n: number): string {
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M";
  if (n >= 1e3) return "$" + Math.round(n / 1e3) + "k";
  return "$" + Math.round(n);
}
