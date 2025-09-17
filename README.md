# IdeaBoard

**IdeaBoard** is a community feedback and idea‑voting platform.  
It lets project owners, startups, and product teams collect ideas from their users, allow the community to vote and comment, and prioritize features in a structured way.

- **For project owners:** A clear, centralized channel to capture, triage, and prioritize feedback.  
- **For users:** A transparent place to propose ideas and influence direction.  
- **Why it matters:** Scattered feedback (emails, chats, polls) gets lost. IdeaBoard centralizes suggestions, voting, and moderation with clear ownership and guardrails.

---

## 🛠️ Tech Stack
**Languages & Frameworks**
- **Frontend:** React (Next.js), TailwindCSS
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (Supabase-managed)

**Services & Libraries**
- **Supabase:** Auth, Realtime, Storage, Postgres
- **FastAPI ecosystem:** Pydantic, Uvicorn
- **Testing:** Pytest (backend), Jest/RTL (frontend)
- **Tooling:** Docker Compose, pnpm/yarn, ESLint/Prettier
- **(Later) Workers:** Celery + Redis for background jobs (ranking recompute, digests)

**Deployment**
- Frontend: Vercel
- Backend: Render
- Data: Supabase

---

## 🧠 AI Integration Strategy

### 🧱 Code / Feature Generation
> **Use AI assistants (e.g., Cursor)** to rapidly scaffold **React components, FastAPI routes, Supabase SQL schema, and initial RLS policies**, then **manually review/benchmark** generated code and **write tests for all policies and mutations**.
- Generate boilerplate: forms, list/detail views, CRUD handlers, hooks.
- Draft Supabase SQL (tables, indexes) and RLS skeletons; apply via versioned migrations (Supabase CLI/Alembic).
- Enforce security: never expose Supabase **service role key** in prompts or client code; server-only.

### 🧪 Testing Support
- **Backend:** Use AI to draft **pytest** suites for endpoints, services, and RLS edge cases (allow/deny on select/insert/update/delete).
- **Frontend:** Use AI to scaffold **Jest + React Testing Library** tests for components, hooks, and page flows (submission, voting, commenting).
- Include negative tests (unauthenticated, wrong role, invalid input) and property-based cases where meaningful.

### 📡 Schema‑Aware / API‑Aware Generation
- Feed AI the **current database schema** (or migration diff) to produce accurate SQL/queries and DTOs.
- Provide the **FastAPI OpenAPI spec** so AI can generate typed client calls (fetchers/hooks) and example requests.
- For consistency, include file tree snippets so generated code matches existing conventions (paths, imports, naming).

---

## 🔍 In‑Editor / PR Review Tooling
**Primary Tool:** Cursor (AI‑powered IDE)
- Use for: scaffolding, refactors, PR summaries, and commit message generation.
- Review workflow: AI proposes changes → human approval → run linters/tests → merge.

**Prompting Strategy**
- Always include **schema or OpenAPI excerpts**, relevant **file tree**, and **explicit acceptance criteria**.
- Ask for **minimal diffs** and **explanations first** for auth/RLS/critical paths.

### Sample Prompts
1) **Auth tests (backend)**  
   _“Generate a pytest suite for the `/api/v1/posts` endpoints that covers: authenticated create, unauthenticated create (403), author‑only update/delete, and admin override. Use the provided RLS policies and fixtures.”_

2) **Client hook from OpenAPI**  
   _“Given this OpenAPI path for `GET /api/v1/posts?sort=top&limit=20`, generate a React hook using Fetch + React Query that types responses, caches by params, and handles 401/429 retries.”_

3) **Schema‑driven RLS**  
   _“Using this Supabase schema (tables: users, posts, comments, votes, reports) generate RLS policies where users can only modify their own rows, read all published rows, and admins (role in `public.users`) can moderate. Include policy names and comments.”_
