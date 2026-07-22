// Domain constants — the enum-like values validated at the app layer (SQLite has no enums).

export const ROLES = [
  "Data Analyst",
  "Product Manager",
  "ML Engineer",
  "Software Engineer",
  "Designer",
  "Marketing",
] as const;
export type RoleName = (typeof ROLES)[number];

export const REFERRAL_STAGES = ["REFERRED", "INTERVIEWING", "OFFER", "HIRED", "DECLINED"] as const;
export type ReferralStage = (typeof REFERRAL_STAGES)[number];
export const ACTIVE_PIPELINE: ReferralStage[] = ["REFERRED", "INTERVIEWING", "OFFER", "HIRED"];

export const APPLICATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

// The verified-outcome taxonomy + SROI proxy rubric.
// attribution = how much the community caused it (SROI deadweight); deliberately conservative.
export const OUTCOME_TYPES = {
  JOB: { label: "Job placed", icon: "💼", rawLabel: "First-year total comp ($)", attr: 30, iris: "PI4060" },
  PROMOTION: { label: "Promotion / raise", icon: "📈", rawLabel: "Annual raise ($)", attr: 25, iris: "wage" },
  CLIENT: { label: "Client / contract", icon: "🤝", rawLabel: "First-year contract ($)", attr: 20, iris: "revenue" },
  FOUNDER: { label: "Founder launched", icon: "🚀", rawLabel: "Follow-on + jobs value ($)", attr: 15, iris: "enterprises" },
  CAPITAL: { label: "Capital raised", icon: "💰", rawLabel: "Amount raised ($)", attr: 10, iris: "capital" },
  CREDENTIAL: { label: "Credential earned", icon: "🎓", rawLabel: "Annual wage premium ($)", attr: 25, iris: "skills" },
} as const;
export type OutcomeType = keyof typeof OUTCOME_TYPES;
export const OUTCOME_KEYS = Object.keys(OUTCOME_TYPES) as OutcomeType[];

// Default program cost for the SROI denominator (Growth tier $349 x 12).
export const DEFAULT_PROGRAM_COST = 4188;

export function splitList(s: string | null | undefined): string[] {
  return (s ?? "").split(",").map((x) => x.trim()).filter(Boolean);
}
