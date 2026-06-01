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

**Status: BUILDING.** Phase 0 shipped and is **live-verified** — `creatorslink.io` is deployed; the proxy session gate redirects unauthenticated requests 307→`/login`, the Vercel framework preset is correct, and the signup→profiles trigger has fired on a real account. Phase 1 (tracker core) is **built, deployed, and verified at the infra/data/code layers** (all app routes RLS-gated, all 8 tables have RLS enabled, write paths check `error` + validate with zod); the one residual is a manual logged-in UI click-through.

| Phase | What | State |
|---|---|---|
| 0 | Foundation: scaffold, Supabase, migration, auth, deploy a logged-in empty dashboard | **Done — live-verified** |
| 1 | Tracker core: brands → deals → deliverables → dashboard | **Built & deployed; data/route/code verified — manual UI click-through pending** |
| 2 | Money tracking (visibility only, no movement) | **Built (code), build green; manual UI verify pending** |
| 3 | Document vault | **Built & deployed-ready; bucket/policies/RLS verified live via SQL — push + manual UI click-through pending** |
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
- **D-020 — Document vault: private Storage bucket + storage RLS; the storage key is a UUID, never the filename; uploads capped at 4 MiB to stay under Vercel's request-body limit.** *(2026-05-31)* Files live in a **private** Supabase Storage bucket `documents` (`0006_documents_storage`); the `documents` metadata table (`name`, `storage_path`, `type`, `deal_id`) already shipped in `0001_init`. *Decisions inside this:* (a) **Private bucket, signed-URL downloads** — contracts/invoices are sensitive, so downloads go through a 60-second signed URL minted on demand by a GET route handler (`app/(app)/deals/[id]/documents/[docId]/route.ts`), not a public URL baked into page HTML. (b) **Storage key = `{owner_id}/{deal_id}/{uuid}{.ext}`, the original filename stored only in the `name` column** — keeping the raw filename out of the key sidesteps space/unicode/`#`/`?` key-mangling entirely; the extension is cosmetic (content type is set explicitly on upload). (c) **Defense-in-depth multi-tenancy** — storage RLS scopes every object by `(storage.foldername(name))[1] = auth.uid()::text` *on top of* the table's `owner_id = auth.uid()`, so even a forged `storage_path` can't reach another creator's files; the bucket also carries a server-side `file_size_limit` + `allowed_mime_types`. (d) **4 MiB cap** — the upload runs through a server action, so it must sit under Vercel's ~4.5 MB serverless request-body ceiling; the same number is enforced in three places that must agree (the action's `MAX_DOCUMENT_BYTES`, `next.config` `serverActions.bodySizeLimit`, the bucket `file_size_limit`). Server-first per **D-016**: upload + delete are server actions; the upload form is a plain `<form encType="multipart/form-data">` (no client component). *Deferred (needs no new infra, just deferred):* **large-file uploads** via a direct-to-storage signed *upload* URL (browser → Supabase, bypassing the function body) — the documented upgrade path the day a creator hits the 4 MiB cap. *Known minor edge:* the app's MIME pre-check is skipped when the browser sends an empty `file.type` (some OS/browser combos for `.docx`/`.xlsx`); the upload then carries `application/octet-stream`, which the bucket's `allowed_mime_types` rejects with a storage 400 — it fails gracefully (error surfaced, nothing corrupted), not silently. Acceptable for v1; tighten by extension-sniffing if it bites.
- **D-019 — Deliverable submission progress = submitted ÷ a deal-level target; deliverable due dates are optional (checkbox-gated).** *(2026-05-31)* A deal carries a `deliverable_target` (e.g. a retainer "for 10 videos"; `0005_deal_deliverable_target`, nullable). The deal page shows a **submission progress bar** = (deliverables submitted to the brand) ÷ target, e.g. `2/10`. *Numerator decision:* "submitted to the brand" = status ∈ {`submitted`, `approved`, `revision`} (`SUBMITTED_DELIVERABLE_STATUSES` / `isSubmittedToBrand`) — a video that's been sent at least once counts, even if the brand wants a revision. *Target decision:* the denominator is the **contracted target**, not the count of rows that exist, so the bar reads `2/10` before all 10 rows exist — forward-compatible with the future TikTok-API auto-pull (videos arrive over time toward a fixed quota). Deliverable **due dates are now optional**: a deliverable has no deadline unless agreed, so the date field is gated behind a "Set a due date" checkbox (`components/due-date-field.tsx`, same D-016 client-exception pattern as usage rights) and the action nulls `due_date` when the box is unticked. *Deferred (needs the brand portal / TikTok API, which don't exist yet):* the actual submit-to-brand action, auto-pulling posted videos, and brand-side approval/revision review — for now the creator drives status manually on the existing board, and the progress bar reads off those statuses.
- **D-018 — Usage rights is a separately-priced deal component; "Total Value" is relabeled "Retainer Amount".** *(2026-05-31)* A deal's `total_value` is the **Retainer Amount** (content/retainer) and is labeled that way on every deal regardless of one-off vs retainer type (founder's call — relabel everywhere, not adaptive). Usage rights is licensed separately: a `usage_rights` boolean toggle reveals a `usage_rights_amount` priced on a `usage_rights_basis` of **per video** or **package** (`0004_deal_usage_rights`). *Decisions inside this:* (a) per-video stores the **rate only** — it is NOT auto-multiplied by the deliverable count, since the count is fluid and the creator reads "$X/video" directly; (b) retainer and usage rights are shown as **two independent amounts**, never summed into a combined total. The deals list also now surfaces a **deliverables count** per deal (`{done}/{total}`) so a creator sees how many videos a campaign needs at a glance. The checkbox-driven reveal is a small client component (`components/usage-rights-field.tsx`) — the **first deliberate client-interactivity exception to D-016**; the revealed inputs are plain form fields and the server action still nulls them when the box is unticked, so correctness stays server-side.
- **D-017 — Payment "overdue" is derived, never stored.** *(2026-05-31)* The `payment_status` enum keeps an `overdue` value, but it is never written to a row. A creator sets only the workflow state (`expected → invoiced → paid`); "overdue" is computed at read time as `(status ∈ {expected, invoiced}) && due_date < today`. *Why:* a stored `overdue` would need a daily cron to flip rows when a due date passes (out of scope) and would lie the instant a date passes or a payment is paid. Deriving it can't go stale and mirrors the existing dashboard deliverable-overdue precedent. The timezone of `today` is centralized in `lib/dates.ts` (server clock / UTC on Vercel — a known ~day-accuracy limitation, not yet fixed). Related: `paid_date` auto-stamps to today when a payment is marked paid and clears when moved off paid; payment currency inherits the deal's currency; individual amounts render with cents via `formatMoneyExact` (the whole-dollar `formatMoney` stays for the deal headline value).
- **D-016 — Server-first CRUD: server components + server actions + zod, deferring TanStack Query and react-hook-form (shadcn/ui is kept per D-008).** *(2026-05-31)* Phase 0 set the pattern (server actions for auth, no client query cache) and Phase 1 follows it: data is read in server components and mutated via server actions with `revalidatePath`, so TanStack Query's client cache is redundant and RHF's client form state is unneeded for these progressive-enhancement forms. zod still validates every action. shadcn/ui is **not** dropped — its components compose fine inside server-action `<form>`s; they're themed to the brand palette (shadcn's semantic tokens point at `--cl-*` brand vars in `globals.css`), and form `<select>`s use a styled native `<select>` (`components/ui/native-select.tsx`) rather than Base UI's controlled Select. Revisit TanStack/RHF if/when a screen needs genuine client-side interactivity (e.g. optimistic drag-drop on the deliverables board).

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
- **2026-05-31 (Phase 0)** — Scaffolded the repo: Next.js 16 (App Router) + TypeScript + Tailwind v4, Supabase SSR auth (signup/login, session middleware, protected `(app)` routes, empty dashboard), profiles auto-create trigger. Migrations `0001_init` (full v1 schema incl. unified inbox tables, RLS `owner_id = auth.uid()`) and `0002_profiles_trigger` applied to the Supabase project. Build green; pushed to GitHub.
- **2026-05-31 (Phase 1)** — Tracker core built: Brands (create/edit/list/delete), Deals (create/edit/list/delete, one-off + retainer, brand-linked) with a deal detail page, Deliverables (create/edit/delete + status board todo→in_progress→submitted→approved/revision), and a dashboard wiring "due this week"/"overdue"/active-deal counts. Added a Settings (profile) page and an Inbox Phase-5 stub. Adopted shadcn/ui (base-nova / Base UI) themed to the brand palette; recorded **D-016** (server-first CRUD, defer TanStack/RHF, keep shadcn+zod). Build + lint green; pending live verification.
- **2026-05-31 (Submission progress + optional due dates)** — Added a deal-level `deliverable_target` (`0005`) and a **submission progress bar** on the deal page (`submitted ÷ target`, e.g. `2/10`, with "N remaining"); "submitted" = status in {submitted, approved, revision} via `SUBMITTED_DELIVERABLE_STATUSES`. Deals list "Deliverables" column now reads `{submitted}/{target}` (falls back to row count when no target). Made deliverable **due dates optional** behind a "Set a due date" checkbox (`components/due-date-field.tsx`); the action nulls `due_date` when unticked. Recorded **D-019**; captured the deferred brand-portal/TikTok-API submission flow there. `next build` + lint green; column + RLS verified; manual UI click-through pending.
- **2026-05-31 (Deals enhancements)** — Relabeled "Total Value" → "Retainer Amount" across the create form, edit form, deal detail card, and deals table. Added **usage rights** to deals (D-018): a checkbox that reveals a separately-priced amount on a per-video-or-package basis (`0004_deal_usage_rights` migration; new `usage_rights` / `usage_rights_amount` / `usage_rights_basis` columns). Per-video stores the rate only (no auto-total); retainer + usage rights shown as separate amounts. Deals table now shows a per-deal **deliverables count** (`{done}/{total}`). New client component `components/usage-rights-field.tsx` (first D-016 client-interactivity exception). Also backfilled the missing `0003_revoke_execute_on_security_definer_fns.sql` migration file so the repo matches the DB. `next build` + lint green; columns + RLS verified; manual UI click-through pending.
- **2026-05-31 (Phase 2)** — Money tracking (visibility only, no movement) built. New `payments` CRUD via `lib/actions/payments.ts` (create/edit/quick-set-status/delete) and a payments section on the deal detail page (add/edit form + list with per-deal Paid/Outstanding totals). Dashboard gained a revenue overview (Paid this month / Outstanding / Overdue) and an "Owed to you" list. Recorded **D-017** (overdue derived, never stored). Supporting bits: `lib/dates.ts` centralizes "today" (the prior dashboard tz-TODO now lives here), `formatMoneyExact` (cents) added, `PaymentStatusBadge` + derived-overdue helpers in types. No migration — the `payments` table + `payment_status` enum already shipped in `0001_init`. `next build` + lint green; manual logged-in UI click-through pending (no `.env.local` locally).
- **2026-05-31 (Phase 3 — Document vault)** — Built the document vault: per-deal upload / list / download / delete of contracts, briefs, invoices, and images. New migration `0006_documents_storage` creates a **private** Storage bucket `documents` (`file_size_limit` 4 MiB + `allowed_mime_types`) and four `storage.objects` RLS policies scoping every object by `(storage.foldername(name))[1] = auth.uid()` (the `documents` table itself shipped in `0001_init`). New `lib/actions/documents.ts` (`uploadDocument` / `deleteDocument`, both server actions checking `const { error } = await`, with orphaned-object cleanup if the metadata insert fails); a GET route handler `app/(app)/deals/[id]/documents/[docId]/route.ts` mints a 60-second signed download URL; the deal page's Phase-3 placeholder is replaced with a real upload form + document list. `next.config` pins `serverActions.bodySizeLimit: "4mb"`; types gain `Document` / `DOCUMENT_TYPES` / `MAX_DOCUMENT_BYTES` / `ALLOWED_DOCUMENT_MIME`. Recorded **D-020** (private bucket, UUID storage key, 4 MiB cap rationale, deferred direct-to-storage large-file path). `next build` + lint green; bucket private + size/mime limits + all four storage policies verified live via SQL. **Residual:** push to deploy, then the manual logged-in upload→download→delete UI click-through (needs a real session).
- **2026-05-31 (deploy fix + live verify)** — Got the production deploy healthy and verified Phase 0/1 to the extent possible without a logged-in browser. Deploy fixes: migrated `middleware.ts → proxy.ts` (Next 16 + @supabase/ssr can't bundle on Edge; `275ff06`), promoted to live (`b4aeefb`), pinned `vercel.json` `"framework":"nextjs"` so routes stop 404-ing at the edge (`94157a4`). Verified live: `creatorslink.io` 307→`/login`; all `(app)` routes RLS-gated, `/login` 200; all 8 tables present with RLS enabled and enums matching the zod schemas; signup→profiles trigger fired (1 profiles row); brands/deals/deliverables write paths all check `const { error } = await` + zod-validate. Security advisors: all WARN, zero ERROR — 2 SECURITY DEFINER trigger fns callable via RPC (low risk, revoke EXECUTE as hardening) and leaked-password protection disabled (one Auth toggle). **Residual:** manual logged-in UI click-through (create brand→deal→deliverable, status board) — the only check that needs a real session.
