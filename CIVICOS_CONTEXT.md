# CivicOS — Master Project Context

> This file is the handoff/source-of-context document for CivicOS.
> Any AI assistant or coding agent working on this project should read this file completely before making changes.

## 1. Project identity

**Project:** CivicOS  
**Concept:** AI-assisted civic problem solving platform  
**Goal:** Help users understand a difficult city problem, identify root causes, design possible interventions, test scenarios, detect bottlenecks, and estimate projected impact.

Core flow:

**Problem → Understand → Solve → Simulate → Measure**

One-line description:

> CivicOS helps people understand a difficult city problem, find its root causes, design a solution, test different scenarios, and measure expected impact.

Important product principle:

- AI provides analysis, suggestions, classifications, explanations, and assumptions.
- Deterministic TypeScript code performs numerical calculations, scenario comparisons, constraints, and bottleneck detection.
- Calculated outputs must not be fabricated by AI.
- Show provenance where useful: `user_input`, `calculated`, `ai_suggestion`, `assumption`.
- Avoid false precision. Use terms such as estimated/projected when appropriate.

---

## 2. Hackathon context

CivicOS is being prepared as a practice/learning project for the Karachi Youth Summit 2026 / Karachi 2047 Hackathon.

Important hackathon rule:

- The actual hackathon solution must be built after the problem statement is given on the day.
- Pre-built private work cannot simply be submitted as the final hackathon solution.
- Public/open-source libraries and public tools are allowed.
- Teams bring their own laptops/equipment.
- Every team must present at the end.

Therefore, CivicOS development before the event is primarily for:
- learning
- architecture practice
- reusable generic skills
- understanding AI/database/simulation workflows

Do not assume that the pre-built CivicOS implementation can automatically be submitted as the hackathon solution.

---

## 3. Current technology stack

Planned/current stack:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-compatible UI/components
- lucide-react
- Supabase
  - PostgreSQL
  - Auth
  - Row Level Security (RLS)
- OpenAI API later
- Recharts later
- Mapbox/MapLibre only when location is actually relevant
- Vercel later
- GitHub for version control

Current local project path:

`C:\Users\Nahyan\Documents\ChatGPT\CivicOS`

---

## 4. High-level architecture

Target architecture:

```text
Next.js UI
    ↓
Server Actions / Route Handlers
    ↓
Domain services
    ├── Supabase/Auth + PostgreSQL + RLS
    ├── AI orchestration
    └── Deterministic simulation engine
            ↓
        Scenarios
            ↓
       Bottlenecks
            ↓
          Results
```

Important architectural rule:

- Do not put privileged Supabase credentials in browser/client code.
- OpenAI API keys must remain server-side.
- Server-side services should own authentication, validation, persistence, provenance, and error handling.
- Database RLS is a real security boundary, not just UI logic.

---

## 5. Main product features planned

### Dashboard
- CivicOS overview
- Problems analyzed
- Solutions tested
- Scenarios simulated
- Projected impact

### Problem creation
- Problem title
- Problem description
- Analyze Problem action later

### AI Problem Analyzer
Later phase:
- problem summary
- stakeholders
- root causes
- affected people
- constraints

### Root Cause Map
Later phase:
- visual cause/effect graph
- parent/child causes

### Solution Designer
Later phase:
- multiple solution options
- estimated cost
- difficulty
- potential impact
- resources
- risks

### Solution Builder / Workflow
Later phase:
- turn a solution into a workflow/system design

### Impact Simulator
Later phase:
- variables/sliders
- deterministic formulas
- scenario changes
- projected metrics

### Scenario Comparison
Later phase:
- save multiple scenarios
- compare outputs

### Bottleneck Detection
Later phase:
- detect constraints
- identify bottlenecks
- explain possible interventions

### Impact Dashboard
Later phase:
- projected impact
- charts
- assumptions
- bottlenecks

---

## 6. Planned folder architecture

The intended architecture is approximately:

```text
src/
  app/
    (marketing)/page.tsx
    (app)/
      dashboard/page.tsx
      problems/
        page.tsx
        new/page.tsx
        [problemId]/
          overview/page.tsx
          analysis/page.tsx
          stakeholders/page.tsx
          root-causes/page.tsx
          solutions/page.tsx
          model/page.tsx
          workflow/page.tsx
          simulation/page.tsx
          scenarios/page.tsx
          bottlenecks/page.tsx
          impact/page.tsx
      layout.tsx
    api/
      ai/[operation]/route.ts
      simulations/run/route.ts
      exports/route.ts
    auth/
  components/
    ui/
    problems/
    analysis/
    simulation/
    charts/
    maps/
  features/
    problems/
    ai/
    solutions/
    scenarios/
    simulation/
    impact/
  lib/
    supabase/
    ai/
    validation/
    errors/
    provenance/
  server/
    repositories/
    services/
    policies/
  simulation/
    core/
    models/
    formulas/
    bottlenecks/
    types/
  types/
  config/
supabase/
  migrations/
  seed.sql
tests/
  unit/
  integration/
  e2e/
```

The actual repository may currently be smaller/different because development is incremental. Inspect the actual files before assuming every planned file exists.

---

## 7. Database design

Planned initial tables:

### profiles
- id UUID primary key, referencing auth.users(id)
- display_name
- avatar_url
- created_at
- updated_at

### problems
- id UUID primary key
- owner_id UUID referencing profiles/auth.users
- title
- description
- status
- location_context JSONB nullable
- created_at
- updated_at
- deleted_at nullable

### problem_inputs
- id UUID primary key
- problem_id UUID
- key
- value_json JSONB
- unit nullable
- source_note nullable
- provenance
- created_at

### problem_analyses
- id UUID primary key
- problem_id UUID
- ai_run_id nullable
- summary nullable
- structured_output JSONB
- review_status
- created_at
- updated_at

### ai_runs
- id UUID primary key
- problem_id UUID nullable
- operation
- model nullable
- prompt_version nullable
- request_json JSONB nullable
- response_json JSONB nullable
- status
- input_tokens nullable
- output_tokens nullable
- created_at

Future tables are expected for:
- solutions
- solution_models
- scenarios
- simulation_runs
- simulation_results
- bottleneck_results
- scenario_comparisons
- audit_logs

Do not create all future tables prematurely unless the current phase requires them.

---

## 8. Security model

RLS should be enabled on every user-owned table.

A normal authenticated user must only be able to access data belonging to their own problems.

Child tables such as:
- problem_inputs
- problem_analyses
- ai_runs

must not bypass ownership of the parent problem.

Do not use insecure policies such as:

```sql
USING (true)
```

Database ownership/security must be enforced by Supabase RLS, not just by client-side code.

---

## 9. AI architecture planned for later

Single server-only AI orchestration layer.

Each AI operation should have:
- versioned prompt
- structured output/schema validation
- persisted run metadata
- approved project data only
- status/token metadata where useful
- human review before AI suggestions become accepted facts

AI explanation endpoints should receive already-calculated simulation results and should not alter or fabricate numerical values.

Planned AI operations include:
- analyze problem
- extract stakeholders
- generate root causes
- generate solutions
- explain results

---

## 10. Simulation architecture planned for later

Simulation must be deterministic.

Concept:

```text
SimulationModelDefinition
  ├── input variables
  ├── assumptions
  ├── constraints
  ├── formulas
  ├── output metrics
  └── bottleneck rules

SimulationEngine
  → validate inputs
  → resolve defaults/overrides
  → evaluate formulas
  → evaluate constraints
  → detect bottlenecks
  → return typed results
```

Do not execute arbitrary formulas stored in the database.

Models should be versioned and resolved inputs/model configuration should be snapshotted for reproducibility.

---

## 11. Phase history

### Phase 1 — UI foundation
Completed.

Implemented:
- Next.js App Router
- TypeScript
- Tailwind
- ESLint
- shadcn-compatible foundation
- lucide-react
- responsive CivicOS app shell
- sidebar/header/mobile navigation
- dashboard
- Problems page
- Create Problem page
- placeholder Solutions
- placeholder Simulator
- placeholder Scenarios
- placeholder Impact
- loading/error states

Phase 1 verification:
- lint passed
- TypeScript passed
- dev server started
- routes returned successfully

Dashboard initially contained demo metrics. Demo/static values must not be treated as real CivicOS data.

---

## 12. Phase 2 — current state

Phase 2 goal:

**Supabase + Authentication + Real Problem CRUD**

Codex was used to implement a large portion of Phase 2.

Important current state from the latest work:

- Supabase project has been created.
- Supabase project name: CivicOS.
- Supabase region: South Asia (Mumbai).
- Supabase Free plan.
- `.env.local` has been created in the root CivicOS folder.
- Supabase URL and publishable key were configured locally.
- Authentication pages exist.
- Email/password signup/login works.
- Email confirmation was completed successfully.
- After confirmation, the CivicOS dashboard opens.
- Codex edited approximately 30 files during Phase 2 work.
- Codex reported authenticated server-side CRUD and parent-ownership RLS.
- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.

### CURRENT BLOCKER

The Supabase Table Editor currently shows:

> No tables or views

Therefore, the migration/schema definitions created by the project have not yet been applied to the actual Supabase database.

When testing Create Problem, the application showed:

> We could not save this problem. Please try again

This is expected because the actual database tables are currently absent.

### Next exact task

Inspect the local:

```text
supabase/migrations/
```

directory and identify the migration SQL files already created by Codex.

Do NOT immediately create duplicate tables manually.

Do NOT randomly write new SQL before inspecting the existing migration files.

The goal is to apply the existing project migrations to the Supabase database safely.

---

## 13. Current Git state

The project is currently on:

```text
master
```

and has not yet had its first Git commit.

Earlier `git status` showed:

```text
On branch master

No commits yet

Untracked files:
  .gitignore
  AGENTS.md
  CLAUDE.md
  README.md
  components.json
  eslint.config.mjs
  next.config.ts
  package-lock.json
  package.json
  postcss.config.mjs
  public/
  src/
  supabase/
  tsconfig.json
```

Do not blindly commit until the current Phase 2 state has been verified.

After the database setup is verified, create a sensible first commit and connect/push to the user's GitHub repository.

Never commit `.env.local` or secrets.

---

## 14. Environment variables

Current local file:

```text
CivicOS/.env.local
```

Expected variables:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Do not put secret/service-role keys into client-visible variables.

Never expose or share passwords, secret keys, service-role keys, or other private credentials.

---

## 15. Current development tools

Available tools/workflows include:
- Codex
- VS Code
- Cursor
- GitHub Copilot
- Antigravity where legitimately available
- ChatGPT for planning, debugging, review, prompts, and architecture

Important principle:

AI tools are helpers. The actual source of truth is:
1. project files
2. database
3. Git history/GitHub
4. project context documents

Do not depend on one AI agent's conversation memory.

If one AI tool reaches its usage limit, another tool should inspect the existing project and continue from the current state.

---

## 16. AI handoff instructions

When starting work in a new AI coding tool:

1. Read this file completely.
2. Read `AGENTS.md`.
3. Read `README.md`.
4. Inspect the actual repository before editing.
5. Check Git status.
6. Check current implementation rather than assuming planned features exist.
7. Continue from the current state.
8. Do not rebuild completed features.
9. Do not overwrite working architecture without a clear reason.
10. Ask/stop when a required secret or external manual action is needed.
11. Never expose secrets.
12. Verify changes with lint/typecheck/tests where appropriate.

Suggested handoff prompt:

> Read `CIVICOS_CONTEXT.md`, `AGENTS.md`, and `README.md` completely. Inspect the existing CivicOS repository and continue from its current state. Do not restart or rebuild completed features. First summarize the current implementation and identify the next unfinished task. Make only the changes required for that task, then run appropriate checks.

---

## 17. Important product decisions

CivicOS should feel like a professional civic-tech/SaaS product, not a generic university AI project.

Design direction:
- clean typography
- whitespace
- cards
- charts
- subtle animation
- clear status
- responsive layout
- professional information hierarchy

AI should not pretend assumptions are facts.

Use:
- estimated
- projected
- assumption
- AI suggestion
- calculated

where appropriate.

---

## 18. Demo story

Potential demo narrative:

Opening:

> “Cities don't have a shortage of ideas. They have a shortage of ways to test those ideas before investing resources.”

Flow:

```text
Problem
→ AI analysis
→ Root causes
→ Solution
→ Simulation
→ Scale
→ Bottleneck
→ Intervention
→ Projected impact
```

Closing:

> “CivicOS doesn't just suggest a solution. It lets us test what happens when that solution meets reality.”

Avoid presenting projections as guaranteed real-world outcomes.

---

## 19. Future development phases

After Phase 2 is completely verified:

### Phase 3
Problem inputs / richer problem model / provenance / audit foundations.

### Phase 4
Generic deterministic simulation contracts and evaluator.

### Phase 5
Scenarios, simulation runs, results, comparisons.

### Phase 6
Bottleneck detection and impact dashboard.

### Phase 7
AI orchestration.

### Phase 8
Root-cause maps, stakeholders, solution designer, workflow builder.

### Phase 9
Exports, observability, accessibility, security hardening, deployment.

### Phase 10
Domain-specific simulation models and advanced polish.

Do not implement all phases at once.

---

## 20. Common mistakes to avoid

- Do not expose Supabase service-role/secret keys.
- Do not commit `.env.local`.
- Do not bypass RLS for convenience.
- Do not let AI fabricate simulation numbers.
- Do not use AI for deterministic calculations.
- Do not execute arbitrary formulas from the database.
- Do not rebuild working UI unnecessarily.
- Do not create duplicate database tables when migrations already exist.
- Do not assume a feature is complete without verifying it.
- Do not depend on one AI tool's chat history.
- Do not claim hackathon compliance without checking the event's current rules.

---

## 21. Immediate next action

**Current task only:**

Inspect:

```text
supabase/migrations/
```

Find the migration SQL files created by Codex.

Then determine the safest way to apply those migrations to the existing Supabase CivicOS project.

Do not move to AI integration or simulation until the database foundation is verified.

