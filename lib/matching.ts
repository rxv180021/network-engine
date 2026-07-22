import { splitList } from "./constants";

export type Insider = {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  industry: string | null;
  refersFor: string;
  referralScore: number;
  avatarColor: string;
};

export type MatchBreakdown = {
  company: number;
  roleFit: number;
  rep: number;
  warm: number;
  total: number;
};

export type RankedInsider = Insider & { breakdown: MatchBreakdown };

/**
 * The matching engine. A referral requires an INSIDER — so company match dominates.
 *   company match  (50)  works at a target company
 *   role fit       (30)  refers for the requested role
 *   reputation     (0-15) proven-referrer weight, from Referral Score
 *   warm path      (5)   shared industry
 */
export function scoreInsider(
  insider: Insider,
  request: { role: string; companies: string[]; industry?: string | null }
): MatchBreakdown {
  const company = request.companies.includes(insider.company ?? "") ? 50 : 0;
  const roleFit = splitList(insider.refersFor).includes(request.role) ? 30 : 0;
  const rep = Math.round((insider.referralScore / 1000) * 15);
  const warm = request.industry && insider.industry === request.industry ? 5 : 0;
  return { company, roleFit, rep, warm, total: company + roleFit + rep + warm };
}

export function rankInsiders(
  insiders: Insider[],
  request: { role: string; companies: string[]; industry?: string | null }
): RankedInsider[] {
  return insiders
    .map((i) => ({ ...i, breakdown: scoreInsider(i, request) }))
    .filter((r) => r.breakdown.company > 0 || r.breakdown.roleFit > 0)
    .sort((a, b) => b.breakdown.total - a.breakdown.total);
}

export function draftIntro(insiderName: string, role: string, company: string): string {
  const first = insiderName.split(" ")[0];
  return `Hi ${first} — a verified member is a strong fit for a ${role} role at ${company}. They cleared our proof bar and their profile maps to what you refer for. Open to referring them?`;
}
