import Anthropic from "@anthropic-ai/sdk";

// Network Engine's agentic referral chief-of-staff. Server-side only.
// Two guarantees, borrowed from the best trust-first AI products:
//  1. Grounded — it only uses the real member facts we pass in; it never invents a
//     relationship, company, or credential.
//  2. Held — every draft is returned for human approval. Nothing is auto-sent.
// If it lacks the grounding to write a credible intro, it HOLDS and flags "needs a person".

const MODEL = "claude-sonnet-5";

export function aiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function textOf(msg: Anthropic.Message): string {
  return msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

export type Person = { name: string; title?: string | null; company?: string | null };

export type IntroResult = {
  grounded: boolean; // false => "needs a person"
  body: string; // the held draft, or the hold reason
  source: "ai" | "mock";
};

/**
 * Draft the warm intro {giver} could send to help {taker} land {opportunity}.
 * Grounded only in the facts provided. Holds (grounded:false) when it can't write a
 * credible, specific intro without inventing.
 */
export async function draftIntro(input: {
  giver: Person;
  taker: Person;
  opportunity: string;
  context?: string;
}): Promise<IntroResult> {
  const { giver, taker, opportunity } = input;

  if (!aiConfigured()) return mockIntro(input);

  const facts = JSON.stringify({
    referrer: giver,
    candidate: { name: taker.name, wants: opportunity },
    notes: input.context || "",
  });

  try {
    const msg = await client().messages.create({
      model: MODEL,
      max_tokens: 700,
      system:
        "You are Network Engine's referral chief-of-staff. You draft the short warm intro that a " +
        "REFERRER could send to open a door for a CANDIDATE. Rules, enforced strictly:\n" +
        "1) Ground ONLY in the facts provided. Never invent a company, title, mutual connection, or claim.\n" +
        "2) If the facts are too thin to write a credible, specific intro without inventing, DO NOT write one.\n" +
        "Return ONLY JSON. Either {\"grounded\": true, \"body\": \"<2-4 sentence intro, first person as the referrer, warm and specific>\"} " +
        "or {\"grounded\": false} when you would have to invent. No prose, no code fences.",
      messages: [{ role: "user", content: facts }],
    });
    const parsed = parseIntro(textOf(msg));
    return { grounded: parsed.grounded, body: parsed.grounded ? parsed.body : holdReason(taker), source: "ai" };
  } catch {
    return mockIntro(input);
  }
}

function parseIntro(text: string): { grounded: boolean; body: string } {
  try {
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}");
    const o = JSON.parse(s >= 0 && e > s ? text.slice(s, e + 1) : text);
    if (o && o.grounded && typeof o.body === "string" && o.body.trim()) return { grounded: true, body: o.body.trim() };
    return { grounded: false, body: "" };
  } catch {
    return { grounded: false, body: "" };
  }
}

function holdReason(taker: Person): string {
  return (
    `Held for a person. I don't have enough grounded detail to write a credible intro for ${taker.name} ` +
    `without inventing something. Add the company, the mutual context, or who actually knows them — ` +
    `then I'll draft it. (Network Engine never fabricates a referral.)`
  );
}

// Deterministic fallback so the product always works on stage, even with no API key.
function mockIntro(input: { giver: Person; taker: Person; opportunity: string }): IntroResult {
  const { giver, taker, opportunity } = input;
  const opp = (opportunity || "").trim();
  // Hold when the ask is too thin to be credible — demonstrates the "needs a person" rule offline.
  if (opp.length < 8 || !/\s/.test(opp)) {
    return { grounded: false, body: holdReason(taker), source: "mock" };
  }
  const first = taker.name.split(" ")[0];
  const gfirst = giver.name.split(" ")[0];
  const where = giver.company ? ` at ${giver.company}` : "";
  const body =
    `Hi — quick intro. I'm ${gfirst}${where}. I want to put ${first} on your radar for ${opp}. ` +
    `${first} is someone I'd vouch for without hesitation, and I think the fit is real. ` +
    `Happy to share more or make a direct connection — just say the word.`;
  return { grounded: true, body, source: "mock" };
}
