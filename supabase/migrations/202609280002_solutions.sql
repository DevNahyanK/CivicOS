create table if not exists public.solutions (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  scenario_id uuid references public.scenarios(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'draft',
  estimated_cost text,
  target_timeline text,
  milestones jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint solutions_title_not_blank check (char_length(btrim(title)) between 1 and 160),
  constraint solutions_status_valid check (status in ('draft', 'planned', 'in_progress', 'implemented', 'archived'))
);

create index if not exists solutions_problem_id_idx on public.solutions (problem_id);
create index if not exists solutions_scenario_id_idx on public.solutions (scenario_id);
create index if not exists solutions_user_id_idx on public.solutions (user_id);
create index if not exists solutions_status_idx on public.solutions (problem_id, status);

create trigger solutions_set_updated_at
  before update on public.solutions
  for each row execute procedure public.set_updated_at();

alter table public.solutions enable row level security;

create policy "Solutions are readable through owned active problems"
  on public.solutions for select to authenticated
  using (
    exists (
      select 1 from public.problems p
      where p.id = problem_id
        and p.owner_id = (select auth.uid())
        and p.deleted_at is null
    )
  );

create policy "Solutions are insertable through owned active problems"
  on public.solutions for insert to authenticated
  with check (
    user_id = (select auth.uid()) and
    exists (
      select 1 from public.problems p
      where p.id = problem_id
        and p.owner_id = (select auth.uid())
        and p.deleted_at is null
    )
  );

create policy "Solutions are updatable through owned active problems"
  on public.solutions for update to authenticated
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

create policy "Solutions are deletable through owned active problems"
  on public.solutions for delete to authenticated
  using (
    user_id = (select auth.uid()) and
    exists (
      select 1 from public.problems p
      where p.id = problem_id
        and p.owner_id = (select auth.uid())
        and p.deleted_at is null
    )
  );
