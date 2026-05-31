# CreatorsLink

**The operating system for the creator side of brand partnerships.** A creator-side business tool for the TikTok / TikTok Shop economy — built so a creator runs their entire partnership business (deals, deliverables, retainers, money owed, paperwork, brand conversations) in one place instead of across Notion, Airtable, Gmail, DMs, and a hired VA.

This README is the **single source of truth** for the project. Read it first. The two companion docs (`CreatorsLink_v1_Build_Plan.md`, `CreatorsLink_PreBuild_Checklist.md`) go deeper on the build and the escrow-era research; this file is the map that ties them together and records *why* every major choice was made.

---

## Working rules for this document

These are non-negotiable. They keep the project calculated and stop us re-litigating settled questions.

- **Every entry is specific and actionable.** No vague items like "improve X." If it can't be acted on, it doesn't belong here.
- **Record decisions WITH the reason.** Every entry in the Decisions Log states the choice *and* why, so we never re-argue a closed decision. To reverse one, add a new dated decision that supersedes it — don't silently edit the reason.
- **Open questions and blockers live in their own section,** each with a concrete next action.
- **When something changes, update the relevant section** — don't just append half-finished notes elsewhere. Then add one line to the Changelog.
- **Keep a dated changelog at the bottom.**

---

## 1. The wedge (and the strategy behind it)

CreatorsLink started as a broad vision — an "operating system for creator partnerships" spanning both sides of the marketplace. The strategy work narrowed that to a **launchable wedge** without abandoning the ambition. Governing principle: **spine before rooms** — build the one tool a creator can't live without, get them dependent on it, then let everything else attach to a foundation they already trust.

**The wedge is the Retainer & Deliverables Tracker** (see D-002). It delivers standalone value to a single creator with zero brands on the platform, needs no payment processing, and can be built solo.

**The destination** (sequenced, not abandoned): the two inboxes → the brand-connection layer → escrow. Each attaches to the tracker spine in the order set by the decisions below.

---

## 2. What v1 is — and isn't

**v1 is:** the tracker. Brands, deals (one-off + retainer), deliverables with a status board, payment *tracking*, a document vault, and reminders. Then the brand-offer email inbox.

**v1 is NOT:**
- **Not** escrow or any movement of money (D-003, D-004).
- **Not** brand-side accounts or a marketplace yet.
- **Not** the on-platform inbox (it's supply-gated — D-010).
- **Not** direct Gmail integration at first (forwarding-first — D-011).
- **Not** TikTok-API content ingestion (optional later plugin — D-015).

---

## 3. The two inboxes

Both are real, and they're opposites in what gates them — which sets their order.

- **Inbox #2 — Brand-offer inbox (email).** Filters a creator's real email to surface "who's reaching out and what they're offering." Creator-side, **not** supply-gated → comes first (Build Plan Phase 5). Ships via **email forwarding** to `{handle}@inbox.creatorslink.io` (no Gmail OAuth, no CASA). The AI layer first earns its place here: structured extraction of brand, deliverables, comp, and deadline from messy email.
- **Inbox #1 — On-platform inbox.** Brand↔creator messaging *inside* CreatorsLink. Technically easy, but **supply-gated** — useless until brands are on the platform → lives in the brand-connection layer, later.

Both write to **one unified schema** (`conversations` + `messages`, with a `source` field) so they render in a single inbox, not two stapled-together systems (D-009).

---

## 4. Tech stack (summary — full setup in the Build Plan)

- **Next.js (App Router) + TypeScript** on **Vercel** (D-007)
- **Supabase** — Postgres + Auth + Storage + Row-Level Security (D-006)
- **Tailwind CSS + shadcn/ui** (D-008)
- **TanStack Query**, **react-hook-form + zod**, **date-fns**
- **Inbound-email service** (Resend/Postmark/SendGrid-class) for the Phase 5 forwarding inbox

Domain: **creatorslink.io** (secured). Subdomain `inbox.creatorslink.io` reserved for Phase 5.

---

## 5. Build phases & current status

**Status: PRE-BUILD.** Name finalized, domain secured, nothing built yet. Next action is Phase 0.

| Phase | What | State |
|---|---|---|
| 0 | Foundation: scaffold, Supabase, migration, auth, deploy a logged-in empty dashboard | **Next up** |
| 1 | Tracker core: brands → deals → deliverables → dashboard | Not started |
| 2 | Money tracking (visibility only, no movement) | Not started |
| 3 | Document vault | Not started |
| 4 | Reminders (the retention hook) | Not started |
| 5 | Brand-offer email inbox (forwarding-first); CASA clock starts in parallel | Not started |
| Later | Direct Gmail (post-CASA) → on-platform inbox → brand-connection → escrow → TikTok API | Sequenced |

Full phase detail, scaffold commands, schema, and folder structure: `CreatorsLink_v1_Build_Plan.md`.

---

## 6. Decisions Log

*Format: decision + reason + date. To reverse one, add a new superseding entry; never edit away the reason.*

- **D-001 — Build the creator side first, not the brand side.** *(2026-05-30)* The brand side is a crowded, well-funded knife fight (GRIN, Aspire, CreatorIQ, Upfluence). The creator side is the open chair — creators duct-tape Notion/Airtable/VAs and nobody owns their seat.
- **D-002 — v1 is the Retainer & Deliverables Tracker.** *(2026-05-30)* Real standalone value, not supply-gated (works with zero brands), no Gmail-CASA blocker in the way, buildable solo, and it hits the loudest pain we hear (tracking retainers, structure, an assistant they don't have).
- **D-003 — v1 tracks money but never moves it.** *(2026-05-30)* Delivers the "who owes me / what's overdue" trust-visibility value with zero money-transmitter or regulatory exposure. The payments schema is built so escrow attaches to it later without a rewrite.
- **D-004 — Escrow is built last.** *(2026-05-30)* It carries the regulatory and liability weight; trust must be earned by the rest of the product first; and once two parties fully trust each other, only genuine product value retains them — escrow fees aren't infinite glue.
- **D-005 — Lead the pitch with "everything in one place / never lose a deliverable," NOT "we protect your payments."** *(2026-05-30)* Escrow ships last, so promising payment protection on day one breaks trust when the product can't deliver it. Payment security is the reason creators *stay* as it's layered in — not the reason they arrive.
- **D-006 — Supabase over Convex.** *(2026-05-30)* The data is deeply relational; RLS gives clean multi-tenancy; Postgres means zero lock-in (we can leave with a standard DB). Convex only wins for live-collaborative/multiplayer apps, which a single-creator tracker is not.
- **D-007 — Next.js (App Router) + Vercel.** *(2026-05-30)* Canonical Vercel deploy; server components, server actions, and API routes are there when the product grows (e.g., the Phase 5 inbound-email webhook).
- **D-008 — Tailwind + shadcn/ui.** *(2026-05-30)* Owned, customizable components → CRM-grade UI fast, without component-library lock-in.
- **D-009 — Two inboxes, one unified schema.** *(2026-05-30)* "Everything in one place" is the core promise; modeling both as a single `conversations`/`messages` pair with `source` ('platform' | 'email') lets them merge into one inbox cleanly instead of being stapled together later.
- **D-010 — Email/brand-offer inbox before the on-platform inbox.** *(2026-05-30)* The email inbox is creator-side and not supply-gated (value with zero brands); the on-platform inbox is dead weight until brands are on the platform.
- **D-011 — Validate the email inbox with forwarding before committing to CASA.** *(2026-05-30)* A unique `inbox.creatorslink.io` forwarding address proves the hard, valuable parsing step with no Gmail OAuth and no CASA wait. Direct Gmail integration is just friction-removal once the value is proven.
- **D-012 — Distribution is creator word-of-mouth/referral, built in from day one.** *(2026-05-30)* The founder's network of creators is the unfair advantage; word-of-mouth is the strongest channel in tight creator communities. "Marketing and hype" amplifies the referral loop — it isn't the loop itself.
- **D-013 — Solo + bootstrapped; sequence over timelines.** *(2026-05-30)* Founder's stated constraint. Focus stays on execution and dependency order, not dates.
- **D-014 — Defer v2 tier thresholds and the creator paid-vs-free line.** *(2026-05-30)* Both need live usage/retention data. Guessing now commits us to numbers we'd defend instead of numbers the data gives us.
- **D-015 — Dispute handling: brand confirms delivery; CreatorsLink mediates per a three-way agreement; TikTok-API content verification is a later optional plugin.** *(2026-05-30)* Keeps v1 light, puts mediation terms in the creator/brand/CreatorsLink agreement, and automates verification later without blocking launch.

---

## 7. Open Questions & Blockers

*Each item has a concrete next action. Close items by moving the resolution into a Decision (with reason) and noting it in the Changelog.*

**Blockers (time-sensitive):**
- **B-001 — Gmail CASA not started.** Gates *direct* Gmail integration (not the forwarding version). Restricted-scope OAuth verification + third-party security assessment takes weeks-to-months and has a cost. **Action:** the day Gmail direct integration is committed, confirm required scopes, register the OAuth consent screen, and start verification/CASA. Run it in parallel with Phases 0–5 so it never blocks launch.

**Open questions:**
- **Q-001 — Beachhead vertical undecided.** **Action:** run ~15 creator discovery interviews (Checklist Track B). Pick the segment where all three are true: pain loudest, money already spent on VAs/brokers, TikTok-Shop-native.
- **Q-002 — Is "brands onboarded before launch" real or aspirational?** Carries weight in the GTM. **Action:** founder to confirm honestly. If real, the brand-connection layer (and Inbox #1) may move sooner; if aspirational, lean harder on the tracker's standalone value. Re-sequence accordingly.
- **Q-003 — Escrow-era pricing (deferred):** payments partner, cost-to-move-a-dollar, platform fee, self-brokered rate. **Action:** run Checklist Tracks A + B when approaching escrow; not before. Do not guess these now.
- **Q-004 — Social handles.** **Action:** secure @creatorslink (or closest variant) on TikTok, Instagram, and X now — distribution is creator word-of-mouth (D-012), so handles matter more here than for most products.
- **Q-005 — Defensive .com.** **Action:** check creatorslink.com availability; register if cheap, to keep a squatter/competitor off it.

---

## 8. Go-to-market (current thinking)

First creators come through the founder's direct network — they already hear the pain (can't reach brands, inbox overwhelm, untracked retainers, want structure). The 10→100 engine is referral inside tight creator communities, so the product builds in easy creator-to-creator invites from the start (D-012). Pitch framing follows D-005: lead with "your whole creator business in one place," not payment protection.

---

## 9. Companion docs

- `CreatorsLink_v1_Build_Plan.md` — tech stack rationale, scaffold commands, full SQL schema (incl. the unified inbox tables), folder structure, phase-by-phase build with done-criteria, first-terminal-session checklist.
- `CreatorsLink_PreBuild_Checklist.md` — escrow-era research: payments-provider questions, the creator-interview script, and the CASA clock. Mostly relevant when approaching the brand-connection and escrow layers.

---

## Changelog

- **2026-05-30** — Initial canonical project doc created. Product name finalized as **CreatorsLink**; domain **creatorslink.io** secured. Captured strategy and wedge (§1–§2), two-inbox sequencing (§3), tech stack (§4), build phases/status (§5), Decisions Log D-001–D-015 (§6), Open Questions & Blockers B-001 / Q-001–Q-005 (§7), and GTM (§8). Build Plan and Pre-Build Checklist renamed from "CreatorOS" to "CreatorsLink" and updated (unified `conversations`/`messages` schema with `source` field added; email inbox sequenced as Phase 5 with forwarding-first → CASA-later; on-platform inbox moved to the brand-connection layer).
