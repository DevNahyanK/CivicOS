create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  model_id text not null,
  inputs jsonb not null default '{}'::jsonb,
  results jsonb not null default '{}'::jsonb,
  is_baseline boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scenarios_name_not_blank check (char_length(btrim(name)) between 1 and 120),
  constraint scenarios_model_id_not_blank check (char_length(btrim(model_id)) between 1 and 100)
);

create index if not exists scenarios_problem_id_idx on public.scenarios (problem_id);
create index if not exists scenarios_user_id_idx on public.scenarios (user_id);
create index if not exists scenarios_baseline_idx on public.scenarios (problem_id, is_baseline) where is_baseline is true;

create trigger scenarios_set_updated_at
  before update on public.scenarios
  for each row execute procedure public.set_updated_at();

alter table public.scenarios enable row level security;

create policy "Scenarios are readable through owned active problems"
  on public.scenarios for select to authenticated
  using (
    exists (
      select 1 from public.problems p
      where p.id = problem_id
        and p.owner_id = (select auth.uid())
        and p.deleted_at is null
    )
  );

create policy "Scenarios are insertable through owned active problems"
  on public.scenarios for insert to authenticated
  with check (
    user_id = (select auth.uid()) and
    exists (
      select 1 from public.problems p
      where p.id = problem_id
        and p.owner_id = (select auth.uid())
        and p.deleted_at is null
    )
  );

create policy "Scenarios are updatable through owned active problems"
  on public.scenarios for update to authenticated
  using (
    user_id = (select auth.uid()) and
    exists (
      select 1 from public.problems p
      where p.id = problem_id
        and p.owner_id = (select auth.uid())
        and p.deleted_at is null
    )
  )
  with check (
    user_id = (select auth.uid()) and
    exists (
      select 1 from public.problems p
      where p.id = problem_id
        and p.owner_id = (select auth.uid())
        and p.deleted_at is null
    )
  );

create policy "Scenarios are deletable through owned active problems"
  on public.scenarios for delete to authenticated
  using (
    user_id = (select auth.uid()) and
    exists (
      select 1 from public.problems p
      where p.id = problem_id
        and p.owner_id = (select auth.uid())
        and p.deleted_at is null
    )
  );
