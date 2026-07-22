// Seed for the Network Engine demo. The community is "Women in AI" — used ONLY as an illustrative
// example of the kind of professional community that buys this. The members below are INVENTED demo
// personas (not real people); referrals/outcomes are created live in the sandbox, never seeded.
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
const PW = hashPassword("demo1234");
const COLORS = ["#E3B25A", "#7CA9E6", "#A97CE6", "#5CC08C", "#E67C9E", "#D9C86A", "#6AD9D2", "#E6A97C"];

const ORG = "Women in AI";

// Illustrative demo personas (invented) — members of the example community. Not real individuals.
const TEAM = [
  { name: "Amara Okafor", email: "amara@demo.networkengine.app", title: "Chapter Lead", role: "ADMIN" },
  { name: "Priya Raman", email: "priya@demo.networkengine.app", title: "ML Engineer", role: "MEMBER" },
  { name: "Sofia Reyes", email: "sofia@demo.networkengine.app", title: "Data Scientist", role: "MEMBER" },
  { name: "Lin Zhao", email: "lin@demo.networkengine.app", title: "AI Researcher", role: "MEMBER" },
  { name: "Fatima Al-Rashid", email: "fatima@demo.networkengine.app", title: "Product Manager, AI", role: "MEMBER" },
  { name: "Grace Kim", email: "grace@demo.networkengine.app", title: "MLOps Engineer", role: "MEMBER" },
  { name: "Nadia Petrov", email: "nadia@demo.networkengine.app", title: "Founder, AI startup", role: "MEMBER" },
  { name: "Zoe Bennett", email: "zoe@demo.networkengine.app", title: "AI Policy Lead", role: "MEMBER" },
  { name: "Ingrid Larsson", email: "ingrid@demo.networkengine.app", title: "Computer Vision Engineer", role: "MEMBER" },
  { name: "Aisha Kone", email: "aisha@demo.networkengine.app", title: "NLP Scientist", role: "MEMBER" },
  { name: "Elena Costa", email: "elena@demo.networkengine.app", title: "AI Ethicist", role: "MEMBER" },
  { name: "Hana Suzuki", email: "hana@demo.networkengine.app", title: "Applied Scientist", role: "MEMBER" },
];

// Opt-in "predictive need" signals (kind matches the console: open | tenure | layoff).
const SIGNALS = [
  { name: "Priya Raman", kind: "open", detail: "Open to work · flagged 4 days ago" },
  { name: "Hana Suzuki", kind: "open", detail: "Open to work · flagged 9 days ago" },
  { name: "Grace Kim", kind: "tenure", detail: "3-yr tenure · promotion-ready signal" },
  { name: "Elena Costa", kind: "layoff", detail: "Layoffs reported at her employer" },
];

async function main() {
  // Clean slate (respect FK order). Seed NO fake referrals/outcomes — those are created live.
  await prisma.introDraft.deleteMany();
  await prisma.signal.deleteMany();
  await prisma.creditEntry.deleteMany();
  await prisma.outcome.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.application.deleteMany();
  await prisma.user.deleteMany();

  const byName = {};
  for (let i = 0; i < TEAM.length; i++) {
    const t = TEAM[i];
    // Tier is EARNED in-app (3 verified referrals). Everyone starts Silver — nothing is bought.
    const u = await prisma.user.create({
      data: {
        email: t.email,
        name: t.name,
        passwordHash: PW,
        role: t.role,
        tier: "SILVER",
        title: t.title,
        company: ORG,
        industry: "AI / ML",
        refersFor: "",
        referralScore: 0,
        credits: 0,
        avatarColor: COLORS[i % COLORS.length],
      },
    });
    byName[t.name] = u.id;
  }

  for (const s of SIGNALS) {
    if (!byName[s.name]) continue;
    await prisma.signal.create({ data: { memberId: byName[s.name], kind: s.kind, detail: s.detail, active: true } });
  }

  console.log(`Seeded ${TEAM.length} demo personas for "${ORG}" + ${SIGNALS.length} signals. No fake referrals.`);
  console.log("Admin login: amara@demo.networkengine.app / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
