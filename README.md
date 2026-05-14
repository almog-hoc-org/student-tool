# ארגז הכלים – הדרך לדירה

פורטל למידה לתלמידי קורס השקעות נדל"ן מגורים בישראל. המערכת מספקת:

- **כלי חישוב פיננסי**: צ׳קאפ פיננסי, מחשבון משכנתא רב-מסלולי, ניתוח כדאיות עסקה.
- **AI Advisor**: תובנות והמלצות מבוססות-כללים מעל הנתונים הפיננסיים של המשתמש.
- **צ׳אט AI**: שיחה חופשית מאומנת על תוכן הקורס (RAG).
- **תמיכה אנושית**: פתיחת tickets לנציג עם thread של תגובות.
- **דשבורד מנהלת**: מעקב התקדמות תלמידים, ניהול cohorts, התראות יזומות.

המסמך הזה הוא המקור היחיד לאיך מקימים, מפתחים ופורסים את הפרויקט.

## Stack

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS + shadcn-ui (Radix)
- **Backend**: Supabase (Postgres + Auth + Row-Level Security + Edge Functions)
- **State**: TanStack Query + localStorage cache עם cloud-sync
- **AI**: Supabase Edge Function ל-RAG (provider מוגדר ב-secrets)
- **Email**: Resend (דרך Edge Function)
- **PWA**: vite-plugin-pwa עם Service Worker

## Setup

דרישות מקדימות:
- Node.js 20+ (או Bun)
- חשבון Supabase מקושר (project ID ב-`.env`)
- חשבון Resend (אופציונלי — נדרש להתראות אימייל)

```bash
# 1. Clone
git clone https://github.com/almog-hoc-org/student-tool.git
cd student-tool

# 2. Install
npm install  # או: bun install

# 3. Environment
cp .env.example .env
# ערוך את .env עם:
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_PROJECT_ID
#   VITE_SUPABASE_PUBLISHABLE_KEY

# 4. Dev server
npm run dev   # http://localhost:8080
```

## Scripts

| פקודה | תיאור |
|--------|------|
| `npm run dev` | dev server עם HMR ב-:8080 |
| `npm run build` | production build (output ב-`dist/`) |
| `npm run build:dev` | build במצב development (לאיתור bugs) |
| `npm run preview` | preview של ה-build המקומי |
| `npm run lint` | ESLint על כל הקוד |

## ארכיטקטורה

ראה `docs/operating-map.md` למפת המוצר המעודכנת. תקצירים:

### Layers
- `src/pages/` — דפי routes (ראה `src/App.tsx`)
- `src/components/` — רכיבי UI משותפים (כולל `ui/` של shadcn-ui)
- `src/contexts/AuthContext.tsx` — auth state גלובלי
- `src/lib/` — לוגיקה עסקית:
  - `storage.ts` — abstraction על localStorage עם cloud-sync
  - `cloud-storage.ts` — Supabase sync של מצב הכלים
  - `support.ts` — Support tickets API
  - `activity.ts` — Activity logging לדשבורד CRM
  - `insights-engine.ts` — מנוע התובנות של ה-Advisor
- `src/integrations/supabase/` — Supabase client + generated types
- `supabase/migrations/` — schema migrations (סדר חמור לפי timestamp)

### Auth flow
1. תלמיד נרשם עם invite code → row ב-`profiles` עם `status='pending'`
2. Admin מאשר → `status='approved'`, נשלח welcome email
3. `ProtectedRoute` חוסם דפי תלמיד עד approval; `AdminRoute` חוסם `/admin/*`

### Persistence
- מצב מחשבונים נשמר ב-localStorage תחת prefix `tool_*`
- `cloud-storage.ts` מסנכרן את אותם keys ל-Supabase table `user_data` (per-user)
- Support tickets, notifications, lessons progress — first-class Supabase tables (לא localStorage)

## Deployment

הפרויקט נפרס ל-Vercel דרך `vercel.json`. ה-CI הסטנדרטי:

```bash
npm run build  # יוצר dist/
# Vercel מקבל את dist/ כ-static output
```

Environment variables על Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

**Secrets בצד Supabase** (לא ב-Vite, כדי לא להיחשף ב-bundle):
- `RESEND_API_KEY` — דרך `supabase secrets set`
- `OPENAI_API_KEY` או `GEMINI_API_KEY` — לפי הספק שנבחר ל-RAG

## Workflow למפתח

1. עבודה על branch (לא ישירות `main`)
2. שינויי schema — תמיד migration חדש, אף פעם לא לערוך migrations ישנים
3. אחרי שינוי schema: `npx supabase gen types typescript --linked > src/integrations/supabase/types.ts`
4. הרץ `npm run lint` לפני push
5. PR ל-`main`

## תיעוד נוסף

- `docs/operating-map.md` — מפת המוצר העדכנית
- `docs/history/` — מסמכי שלבים שהושלמו (לארכיון)
- `TESTING.md` — מדריך QA ידני

## Status

הפרויקט במצב פעיל; ראה תוכנית השיפורים הנוכחית והפיצ׳רים בעבודה ב-`docs/operating-map.md`.
