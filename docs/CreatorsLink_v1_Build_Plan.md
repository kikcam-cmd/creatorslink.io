# CreatorsLink — v1 Build Plan & Tech Stack

*Terminal-ready. Solo, bootstrapped, laser-focused. No timelines — just sequence and done-criteria.*
*Domain: creatorslink.io*

The v1 target is the **Retainer & Deliverables Tracker**: the creator-side tool that gets a creator's whole business in one place so they never lose a deliverable or lose track of who owes them money. It needs no onboarded brands and no payment processing, so you can build and ship it alone. Everything else — the inboxes, brand-connection, and escrow — attaches to this spine later, in the order set out in §5–§6.

---

## 1. The stack (and why)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Canonical Vercel deploy; gives you server components, API routes, and server actions you'll want as the product grows. (If you'd rather stay a pure SPA, Vite + React works — but you'd hand-roll things Next gives free.) |
| Styling / UI | **Tailwind CSS + shadcn/ui** | shadcn gives you owned, un-styled-to-taste components (tables, dialogs, forms) so a CRM-grade UI comes together fast without fighting a component library. |
| Backend / DB | **Supabase** (Postgres + Auth + Storage + RLS) | Relational data, built-in auth, file storage for contracts, and row-level security for multi-tenancy — all in one box. You own standard Postgres, so no lock-in. |
| Hosting | **Vercel** (frontend) + **Supabase** (backend) | Push to git, auto-deploy. Both have free tiers that carry you well past first signal. |
| Data fetching | **TanStack Query** | Caching, refetch, optimistic updates for a snappy CRUD app. |
| Forms / validation | **react-hook-form + zod** | Type-safe forms; zod schemas double as your validation contract. |
| Dates | **date-fns** | Due dates and "what's due this week" math. |
| Inbound email (later) | **email service with inbound parse** (e.g. Resend/Postmark/SendGrid) | Powers the forwarding-based brand-offer inbox in Phase 5 — no Gmail OAuth required to start. |

**The Supabase vs Convex call, recorded:** Supabase wins here because the data is relational, RLS handles tenant isolation cleanly, and Postgres means zero lock-in. Convex would win only if this were a live-collaborative, multiplayer-style app — which a single-creator tracker is not. Decision made; don't relitigate it mid-build.

---

## 2. Scaffold — copy/paste into your terminal

> Tooling moves fast; if a CLI flag has changed since, check the tool's current docs. The architecture below doesn't change.

```bash
# 1. Create the app
npx create-next-app@latest creatorslink --typescript --tailwind --eslint --app --import-alias "@/*"
cd creatorslink

# 2. UI components
npx shadcn@latest init
npx shadcn@latest add button card input table dialog form select badge dropdown-menu sonner calendar popover

# 3. Supabase + data + forms
npm install @supabase/supabase-js @supabase/ssr
npm install @tanstack/react-query react-hook-form zod @hookform/resolvers date-fns

# 4. Supabase CLI for local dev + migrations
npm install -D supabase
npx supabase init
```

Then create a Supabase project (name it `creatorslink`), grab the URL + anon key, and put them in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Deploy target: connect the git repo in the Vercel dashboard (auto-deploys on push), or `npx vercel link`. Point `creatorslink.io` at the Vercel project, and reserve the `inbox.creatorslink.io` subdomain now — Phase 5 routes forwarded brand emails through it.

---

## 3. Data model — the spine

Run this as your first migration (`supabase/migrations/0001_init.sql`). The first six tables are the tracker spine you build immediately. The `conversations`/`messages` tables at the end are **modeled now, built later** — included up front so the two inboxes merge cleanly instead of being stapled together after the fact.

```sql
-- ===== Profiles (1:1 with auth user) =====
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  handle text,
  niche text,
  created_at timestamptz default now()
);

-- ===== Brands (creator's own records of who they work with) =====
create table brands (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  contact_name text,
  contact_email text,
  notes text,
  created_at timestamptz default now()
);

-- ===== Deals (one-off or retainer) =====
create type deal_type as enum ('one_off', 'retainer');
create type deal_status as enum ('negotiating', 'active', 'completed', 'cancelled');

create table deals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid references brands(id) on delete set null,
  title text not null,
  type deal_type not null default 'one_off',
  status deal_status not null default 'negotiating',
  start_date date,
  end_date date,
  total_value numeric(12,2),
  currency text default 'USD',
  notes text,
  created_at timestamptz default now()
);

-- ===== Deliverables =====
create type deliverable_status as enum ('todo','in_progress','submitted','approved','revision');

create table deliverables (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references deals(id) on delete cascade,
  title text not null,
  description text,
  platform text,
  due_date date,
  status deliverable_status not null default 'todo',
  content_url text,
  created_at timestamptz default now()
);

-- ===== Payments (TRACKING ONLY — no money movement in v1) =====
create type payment_status as enum ('expected','invoiced','paid','overdue');

create table payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references deals(id) on delete cascade,
  amount numeric(12,2) not null,
  currency text default 'USD',
  due_date date,
  status payment_status not null default 'expected',
  paid_date date,
  created_at timestamptz default now()
);

-- ===== Documents (metadata; files live in Supabase Storage) =====
create type document_type as enum ('contract','brief','invoice','other');

create table documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid references deals(id) on delete cascade,
  name text not null,
  storage_path text not null,
  type document_type default 'other',
  created_at timestamptz default now()
);

-- ===== Conversations & Messages (UNIFIED INBOX — modeled now, built in Phase 5+) =====
-- `source` is the whole trick: 'platform' threads (brand<->creator inside CreatorsLink)
-- and 'email' threads (forwarded/ingested brand outreach) live in the SAME table,
-- so they render in one unified inbox rather than two separate systems.
create type conversation_source as enum ('platform', 'email');

create table conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source conversation_source not null,
  brand_id uuid references brands(id) on delete set null,   -- matched brand, once known
  deal_id uuid references deals(id) on delete set null,      -- promoted to a deal, if it becomes one
  subject text,
  external_from text,        -- for email threads: raw sender, before it's matched to a brand
  parsed_offer jsonb,        -- AI-extracted: comp, deliverables, deadline, etc.
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound','outbound')),
  sender_label text,
  body text,
  created_at timestamptz default now()
);

-- ===== Indexes =====
create index on brands(owner_id);
create index on deals(owner_id);
create index on deliverables(owner_id, due_date);
create index on payments(owner_id, due_date);
create index on documents(owner_id);
create index on conversations(owner_id, last_message_at desc);
create index on messages(owner_id, conversation_id, created_at);

-- ===== Row-Level Security: every creator sees only their own rows =====
alter table profiles      enable row level security;
alter table brands        enable row level security;
alter table deals         enable row level security;
alter table deliverables  enable row level security;
alter table payments      enable row level security;
alter table documents     enable row level security;
alter table conversations enable row level security;
alter table messages      enable row level security;

create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own brands" on brands
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own deals" on deals
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own deliverables" on deliverables
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own payments" on payments
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own documents" on documents
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own conversations" on conversations
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own messages" on messages
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
```

RLS with `owner_id = auth.uid()` is your entire multi-tenancy story. Get it right once here and you never worry about data leaking between creators.

---

## 4. Folder structure

```
creatorslink/
├─ app/
│  ├─ (marketing)/
│  │  └─ page.tsx              # public landing
│  ├─ (auth)/
│  │  ├─ login/page.tsx
│  │  └─ signup/page.tsx
│  ├─ (app)/                   # protected — redirect if no session
│  │  ├─ layout.tsx            # app shell: nav + auth guard
│  │  ├─ dashboard/page.tsx    # "what's due / who owes me"
│  │  ├─ brands/page.tsx
│  │  ├─ deals/
│  │  │  ├─ page.tsx           # list
│  │  │  └─ [id]/page.tsx      # deal detail: deliverables + payments + docs
│  │  ├─ inbox/page.tsx        # unified inbox (Phase 5+)
│  │  └─ settings/page.tsx
│  ├─ api/
│  │  └─ inbound-email/route.ts # webhook for forwarded brand emails (Phase 5)
│  └─ layout.tsx
├─ components/
│  ├─ ui/                      # shadcn components
│  └─ ...                      # DealCard, DeliverableRow, StatusBadge, OfferCard, etc.
├─ lib/
│  ├─ supabase/
│  │  ├─ client.ts             # browser client
│  │  ├─ server.ts             # server-component client
│  │  └─ middleware.ts         # session refresh
│  └─ utils.ts
├─ middleware.ts               # refresh auth on every request
└─ supabase/migrations/
```

---

## 5. Build phases — sequence, not schedule

Ship each phase before starting the next. The rule is **get it live first, then add features** — deploy a logged-in "hello" before building anything real, so deployment is never the thing that blocks you later.

**Phase 0 — Foundation (live and logged in)**
- Scaffold, Supabase project, run the migration above.
- Supabase Auth: email signup/login, protected `(app)` routes, session middleware.
- Auto-create a `profiles` row on signup (DB trigger or on first login).
- Deploy to Vercel; point creatorslink.io at it.
- *Done when:* you can sign up on the live URL and land on an empty dashboard that only you can see.

**Phase 1 — The tracker core (the wedge — first thing worth showing a creator)**
- Brands: create / edit / list.
- Deals: create / edit / list, one-off **and** retainer, linked to a brand.
- Deliverables: create / edit, status board (todo → in_progress → submitted → approved/revision), per deal.
- Dashboard: "due this week" and "overdue" across all deals.
- *Done when:* a creator can put a real retainer in and see every deliverable with its due date in one view. This is the standalone-value moment — the thing you can actually put in front of someone.

**Phase 2 — Money tracking (the trust pain, without building escrow)**
- Payments per deal: expected / invoiced / paid / overdue, with due dates.
- Revenue overview on the dashboard (this month / outstanding / overdue).
- Auto-flag overdue payments.
- *Done when:* a creator can answer "who owes me money and when" at a glance. Addresses the ghosted/unpaid pain through *visibility* — no money movement, no regulatory exposure.

**Phase 3 — Document vault**
- Upload contracts/briefs to Supabase Storage, attach to a deal, list/download.
- *Done when:* every deal can hold its paperwork in one place.

**Phase 4 — Reminders (the retention engine)**
- Scheduled job (Supabase cron / scheduled function) + transactional email for upcoming and overdue deliverables and payments.
- *Done when:* the product reaches out *to* the creator. This is what turns it from a thing they visit into a thing they rely on — the daily-habit hook.

**Phase 5 — Brand-offer inbox, via email forwarding (the Gmail magic, *without* CASA)**
- This is **Inbox #2**: filtering a creator's real email to surface "who's reaching out and what they're offering." It is creator-side and *not* supply-gated — a single creator with zero brands on the platform gets value day one. That's why it comes before the on-platform inbox.
- Give each creator a unique inbound address: `{handle}@inbox.creatorslink.io`. They forward brand emails (or set a Gmail auto-forward rule). Your `api/inbound-email` webhook receives them.
- Parse each email into a structured offer (brand, deliverables asked, comp, deadline) → store as a `conversations` row with `source='email'` and `parsed_offer`. Render as clean "offer cards" in the unified inbox.
- The parsing step is where the **AI layer earns its place** — structured extraction from messy email, not AI for its own sake.
- *Done when:* a creator forwards a real brand email and gets back a clean, structured offer card. This proves the hard, valuable part (parsing) with no Gmail OAuth and no CASA wait.
- **In parallel, starting now:** kick off Google's restricted-scope OAuth verification + CASA security assessment (weeks-to-months, has a cost). It gates the *seamless* direct-Gmail version. Start the clock the day you commit to Gmail so it isn't what blocks launch later. Forwarding proves the value; CASA later just removes the friction.

---

## 6. Later, and gated — the order things attach to the spine

Named so they stay out of v1 and don't cause scope creep mid-build:

- **Direct Gmail integration** — the OAuth version of Phase 5, unlocked once CASA clears. Same feature, less friction. Do *not* block Phase 5 on it.
- **On-platform inbox (Inbox #1)** — brand↔creator messaging *inside* CreatorsLink. Technically the easy one (it's just `source='platform'` rows in the schema you already have + Supabase realtime), but it is **supply-gated**: useless until brands are actually on the platform, so it lives in the **brand-connection layer**, not the creator-side v1. When it ships, it drops into the same unified inbox beside the email offers.
- **Brand-connection / marketplace** — the two-sided layer: brands as real users, creator↔brand discovery and negotiation.
- **Escrow / payment processing** — last. v1 only *tracks* money; this is where it eventually *moves* it, attaching to the `payments` table you already built. Carries the regulatory + liability weight, so it earns trust last.
- **TikTok API content tracking** — optional plugin that auto-detects "delivered" content for the deliverable/approval flow.

---

## 7. Your first session at the terminal

1. Run the scaffold block in §2 (project name `creatorslink`).
2. Create the Supabase project; paste URL + anon key into `.env.local`.
3. Save §3 as `supabase/migrations/0001_init.sql` and apply it (`npx supabase db push`, or paste into the SQL editor). The inbox tables are in there now but you won't touch them until Phase 5 — that's intentional.
4. Wire `lib/supabase/{client,server,middleware}.ts` and `middleware.ts` (Supabase's Next.js SSR auth setup).
5. Build login/signup + the protected `(app)` shell with an empty dashboard.
6. Push to git → deploy on Vercel → point creatorslink.io at it.
7. Stop. Confirm you can sign up live and see your own empty dashboard. **That's Phase 0 done** — and now nothing about deployment can surprise you later.

Then start Phase 1: Brands, then Deals, then Deliverables, then the dashboard. That order matters — each one is the foreign key the next depends on.
