-- Usage rights as a separate priced component of a deal (D-018). The retainer
-- amount (deals.total_value) covers content; usage rights is licensed
-- separately, priced either per video or as a flat package.
create type usage_rights_basis as enum ('per_video', 'package');

alter table public.deals
  add column usage_rights boolean not null default false,
  add column usage_rights_amount numeric,
  add column usage_rights_basis usage_rights_basis;
