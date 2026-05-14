# Operating Map

_Last updated: 2026-05-14 (post foundation overhaul)_

## Deployment runbook

Before the application can connect to a backend, you need a live Supabase
project. The legacy IDs in `.env` and `supabase/config.toml` both point to
deleted projects (see critical note below).

### 1. Bootstrap Supabase project

```bash
supabase login
supabase projects create <name> --region eu-central-1
supabase link --project-ref <new-ref>
supabase db push        # applies all migrations in supabase/migrations/ in order
```

Then update `.env` and `supabase/config.toml` with the new project ref +
anon key, and re-generate types:

```bash
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### 2. Set secrets

```bash
supabase secrets set OPENAI_API_KEY="..."          # or GEMINI_API_KEY
supabase secrets set RESEND_API_KEY="..."
supabase secrets set EMAIL_FROM="הדרך לדירה <noreply@yourdomain>"
supabase secrets set APP_BASE_URL="https://your-vercel-deploy.app"
supabase secrets set NOTIFICATIONS_WEBHOOK_SECRET="$(openssl rand -hex 32)"
```

### 3. Deploy edge functions

```bash
supabase functions deploy chat-rag
supabase functions deploy send-email
```

### 4. Wire database webhook for outbound email

In Supabase Studio → Database → Webhooks → "Create a new hook":

- Name: `notifications-to-email`
- Table: `notifications`
- Events: `INSERT`
- Method: `POST`
- URL: `https://<project>.functions.supabase.co/send-email?source=webhook`
- Headers: `x-webhook-secret: <NOTIFICATIONS_WEBHOOK_SECRET>`

### 5. Schedule daily at-risk computation

Database → Cron jobs:

```sql
SELECT cron.schedule('compute-at-risk-daily', '0 7 * * *', $$ SELECT compute_at_risk_flags(); $$);
```

### 6. Bootstrap content

```bash
SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<key> \
npx tsx scripts/import-syllabus.ts ./docs/syllabus-example.json
```

Then embed lessons for RAG:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... OPENAI_API_KEY=... \
npx tsx scripts/embed-content.ts
```

---

> **🚨 Critical infrastructure note** (added 2026-05-14):
> Both Supabase project IDs referenced in the repo do not resolve to live projects:
> - `tvpwltthrbadglrmvqub` (`.env`): NXDOMAIN
> - `vzkhvmyhuajapondurrx` (`supabase/config.toml`): NXDOMAIN
>
> The app cannot currently authenticate or persist data against a real backend.
> **Action required** before Phase 1.3+ can be deployed: create a new Supabase project,
> apply all migrations in `supabase/migrations/`, regenerate the publishable JWT, and
> update both `.env` and `supabase/config.toml` to the new ref. All foundation-overhaul
> code is being written assuming this will be wired up; nothing in this codebase requires
> the legacy projects.

## Product surfaces

- **Budget Calculator** (`/`): entry point, stores budget inputs/results.
- **Business Plan** (`/business-plan`): deal analysis, cashflow and return modeling.
- **Mortgage Calculator** (`/mortgage`): loan tracks, amortization, payment analysis.
- **AI Advisor** (`/advisor`): insight layer over saved calculator outputs.
- **Chat** (`/chat`): conversational assistant surface.
- **Account** (`/account`): user profile and settings.
- **Support** (`/support`): lightweight help-desk intake with issue context.
- **Admin** (`/admin*`): dashboard, users, invite codes.
- **Admin Support** (`/admin/support`): escalated support queue.

## Core architecture

### State + storage
- Primary persistence is **localStorage** via `src/lib/storage.ts`.
- Cloud sync is layered on top through Supabase in `src/lib/cloud-storage.ts` and `src/contexts/AuthContext.tsx`.
- Known shared keys:
  - `budget`
  - `budget_results`
  - `business_plan`
  - `mortgage`
  - `mortgage_results`

### Insight pipeline
- `src/lib/insights-engine.ts` reads saved calculator state.
- `src/hooks/useInsights.ts` exposes analysis to the UI.
- `src/pages/AIAdvisor.tsx` renders recommendations, warnings, and next steps.
- `src/lib/support.ts` stores support requests in localStorage and cloud sync.

### Auth / access control
- `AuthProvider` loads session, profile, roles.
- `ProtectedRoute` gates app access.
- `AdminRoute` gates admin surfaces.
- User status supports an approval workflow (`pending` / `approved`).

## Current strengths
- Clear calculator-first workflow.
- Shared saved state enables cross-tool insights.
- Admin surfaces already exist for users/invite codes.
- Cloud sync is present, so the app is not purely local-only.

## Current gaps / risks
- UI copy contains encoding-corrupted Hebrew text in several components.
- The operating map is spread across code rather than captured in one place.
- Help content is mostly embedded in the UI, not centralized.

## Best next bundle candidates

1. **UX cleanup bundle**
   - Fix corrupted UI text.
   - Align navigation labels and empty states.

2. **Content / AI bundle**
   - Centralize explanations and recommendation templates.
   - Make AI Advisor more actionable with next-step suggestions.

3. **Support workflow follow-up**
   - Add ticket assignment / status history.
   - Notify admins when high-priority requests arrive.

## Recommendation

Continue with **UX cleanup**, because the support intake + admin queue now exist and the biggest leverage is still clarity, trust, and recoverability.
