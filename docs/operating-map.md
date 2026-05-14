# Operating Map

_Last updated: 2026-05-14_

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
