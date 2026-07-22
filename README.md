# Network Engine

**The Verified Referral Graph.** A full-stack web app: members earn **Gold** status by
proving a real referral, request referrals through a **matching engine** that finds proven
insiders, and every outcome is tracked into an auditable **SROI outcome ledger**.

Built as a real, running product — not a mockup.

## Stack
- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Prisma 6** ORM + **SQLite** (zero-config local database, real persistence)
- **Auth**: httpOnly signed-cookie sessions + `scrypt` password hashing (Node built-ins, no external auth deps)
- Hand-built design system (dark "stage" identity) — no UI kit

## Run it (one command)

```bash
cd ~/network-engine
npm run setup     # generate Prisma client, create + seed the SQLite DB  (first time only)
npm run dev       # start the app
```

Then open **http://localhost:3000**.

> Already set up in this session and verified end-to-end. If port 3000 is taken:
> `PORT=3100 npm run dev`.

## Demo accounts (password `demo1234`)
| Role | Email |
|---|---|
| Admin (review queue) | `ritthikha@networkengine.test` |
| Gold insider | `maya@networkengine.test` |
| Job seeker (request referrals) | `jordan@networkengine.test` |

## What to try
1. **Sign in as Jordan** → Dashboard → pick a role + companies → **Find my insider** (the matching engine ranks proven insiders; company match dominates because a referral needs an insider) → **Request** (spends a reciprocity credit) → **Advance** the thread to *Hired* (logs a verified outcome).
2. **Outcomes** → log a job/founder/client/capital outcome → watch **economic value + SROI ($1 → $X)** update live.
3. **Sign in as Ritthikha (admin)** → **Admin** → approve a pending application → the member is promoted to Gold and appears in the Directory.

## Architecture
```
app/
  page.tsx                    landing
  login/  apply/              auth + application (Silver -> Gold)
  directory/                  Gold directory (server-rendered + client filter)
  dashboard/                  matching + reciprocity + tracker
  outcomes/                   verified outcome ledger + live SROI
  admin/                      application review -> promote to Gold
  api/
    auth/{login,logout}/      session cookie
    apply/                    create applicant + pending application
    match/                    matching engine
    referrals/                request (spend credit) + [id]/advance (-> outcome on Hired)
    outcomes/                 log a verified outcome
    admin/applications/[id]/  approve / reject
lib/
  db.ts        Prisma client singleton
  auth.ts      scrypt hashing + signed-cookie sessions
  session.ts   requireUser / requireAdmin guards
  matching.ts  the ranking algorithm
  sroi.ts      SROI standardization (proxy x attribution -> $1 -> $X)
  constants.ts taxonomy, proxy rubric, enums
prisma/
  schema.prisma  User . Application . Referral . Outcome . Offer . CreditEntry
  seed.mjs       demo data
```

## Reset demo data
```bash
npm run db:seed      # wipe + reseed
npm run db:reset     # reset schema + reseed
```

---
Originated by Huma — taken further by Ritthikha.
