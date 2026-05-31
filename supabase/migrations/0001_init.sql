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
