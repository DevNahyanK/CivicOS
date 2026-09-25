create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (display_name is null or char_length(display_name) <= 120),
  constraint profiles_avatar_url_length check (avatar_url is null or char_length(avatar_url) <= 2048)
);

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  description text not null,
  status text not null default 'draft',
  location_context jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint problems_title_not_blank check (char_length(btrim(title)) between 3 and 160),
  constraint problems_description_not_blank check (char_length(btrim(description)) between 10 and 5000),
  constraint problems_status_valid check (status in ('draft', 'in_analysis', 'ready_for_design', 'archived')),
  constraint problems_location_context_object check (location_context is null or jsonb_typeof(location_context) = 'object')
);

create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid references public.problems(id) on delete set null,
  operation text not null,
  model text,
  prompt_version text,
  request_json jsonb,
  response_json jsonb,
  status text not null default 'pending',
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz not null default now(),
  constraint ai_runs_operation_not_blank check (char_length(btrim(operation)) between 1 and 100),
  constraint ai_runs_status_valid check (status in ('pending', 'running', 'completed', 'failed', 'cancelled')),
  constraint ai_runs_input_tokens_nonnegative check (input_tokens is null or input_tokens >= 0),
  constraint ai_runs_output_tokens_nonnegative check (output_tokens is null or output_tokens >= 0)
);

create table public.problem_inputs (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  key text not null,
  value_json jsonb not null,
  unit text,
  source_note text,
  provenance text not null,
  created_at timestamptz not null default now(),
  constraint problem_inputs_key_not_blank check (char_length(btrim(key)) between 1 and 120),
  constraint problem_inputs_provenance_valid check (provenance in ('user_input', 'calculated', 'ai_suggestion', 'assumption'))
);

create table public.problem_analyses (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  ai_run_id uuid references public.ai_runs(id) on delete set null,
  summary text,
  structured_output jsonb,
  review_status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint problem_analyses_review_status_valid check (review_status in ('draft', 'reviewed', 'accepted', 'rejected'))
);

create index problems_owner_active_updated_idx on public.problems (owner_id, updated_at desc) where deleted_at is null;
create index problem_inputs_problem_id_idx on public.problem_inputs (problem_id);
create index problem_analyses_problem_id_idx on public.problem_analyses (problem_id);
create index problem_analyses_ai_run_id_idx on public.problem_analyses (ai_run_id);
create index ai_runs_problem_id_idx on public.ai_runs (problem_id);

create function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger problems_set_updated_at before update on public.problems for each row execute procedure public.set_updated_at();
create trigger problem_analyses_set_updated_at before update on public.problem_analyses for each row execute procedure public.set_updated_at();

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.profiles (id, display_name) values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', '')) on conflict (id) do nothing; return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.problems enable row level security;
alter table public.problem_inputs enable row level security;
alter table public.problem_analyses enable row level security;
alter table public.ai_runs enable row level security;

create policy "Profiles are readable by their owner" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Profiles are updatable by their owner" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Problems are readable by their owner" on public.problems for select to authenticated using ((select auth.uid()) = owner_id and deleted_at is null);
create policy "Problems are insertable by their owner" on public.problems for insert to authenticated with check ((select auth.uid()) = owner_id and deleted_at is null);
create policy "Problems are updatable by their owner" on public.problems for update to authenticated using ((select auth.uid()) = owner_id and deleted_at is null) with check ((select auth.uid()) = owner_id);

create policy "Problem inputs are readable through owned active problems" on public.problem_inputs for select to authenticated using (exists (select 1 from public.problems p where p.id = problem_id and p.owner_id = (select auth.uid()) and p.deleted_at is null));
create policy "Problem inputs are insertable through owned active problems" on public.problem_inputs for insert to authenticated with check (exists (select 1 from public.problems p where p.id = problem_id and p.owner_id = (select auth.uid()) and p.deleted_at is null));
create policy "Problem inputs are updatable through owned active problems" on public.problem_inputs for update to authenticated using (exists (select 1 from public.problems p where p.id = problem_id and p.owner_id = (select auth.uid()) and p.deleted_at is null)) with check (exists (select 1 from public.problems p where p.id = problem_id and p.owner_id = (select auth.uid()) and p.deleted_at is null));
create policy "Problem inputs are deletable through owned active problems" on public.problem_inputs for delete to authenticated using (exists (select 1 from public.problems p where p.id = problem_id and p.owner_id = (select auth.uid()) and p.deleted_at is null));

create policy "Problem analyses are readable through owned active problems" on public.problem_analyses for select to authenticated using (exists (select 1 from public.problems p where p.id = problem_id and p.owner_id = (select auth.uid()) and p.deleted_at is null));
create policy "Problem analyses are insertable through owned active problems" on public.problem_analyses for insert to authenticated with check (exists (select 1 from public.problems p where p.id = problem_id and p.owner_id = (select auth.uid()) and p.deleted_at is null));
create policy "Problem analyses are updatable through owned active problems" on public.problem_analyses for update to authenticated using (exists (select 1 from public.problems p where p.id = problem_id and p.owner_id = (select auth.uid()) and p.deleted_at is null)) with check (exists (select 1 from public.problems p where p.id = problem_id and p.owner_id = (select auth.uid()) and p.deleted_at is null));
create policy "Problem analyses are deletable through owned active problems" on public.problem_analyses for delete to authenticated using (exists (select 1 from public.problems p where p.id = problem_id and p.owner_id = (select auth.uid()) and p.deleted_at is null));

create policy "AI runs are readable through owned active problems" on public.ai_runs for select to authenticated using (problem_id is not null and exists (select 1 from public.problems p where p.id = problem_id and p.owner_id = (select auth.uid()) and p.deleted_at is null));
create policy "AI runs are insertable through owned active problems" on public.ai_runs for insert to authenticated with check (problem_id is not null and exists (select 1 from public.problems p where p.id = problem_id and p.owner_id = (select auth.uid()) and p.deleted_at is null));
create policy "AI runs are updatable through owned active problems" on public.ai_runs for update to authenticated using (problem_id is not null and exists (select 1 from public.problems p where p.id = problem_id and p.owner_id = (select auth.uid()) and p.deleted_at is null)) with check (problem_id is not null and exists (select 1 from public.problems p where p.id = problem_id and p.owner_id = (select auth.uid()) and p.deleted_at is null));
create policy "AI runs are deletable through owned active problems" on public.ai_runs for delete to authenticated using (problem_id is not null and exists (select 1 from public.problems p where p.id = problem_id and p.owner_id = (select auth.uid()) and p.deleted_at is null));
