-- How many deliverables (videos) the deal is contracted for, e.g. a retainer
-- "for 10 videos". Drives the submission progress bar (submitted ÷ target).
-- Nullable: a deal with no agreed count just shows no target bar.
alter table public.deals
  add column deliverable_target integer
    check (deliverable_target is null or deliverable_target >= 0);
