// Supabase Edge Function: notify-email
// Transactional email for the signup/approval loop, via Resend.
//
//   kind = "new_signup"  → emails every admin that a new student is pending.
//                          Caller is unauthenticated (the just-signed-up user),
//                          so we VERIFY a matching pending profile exists before
//                          sending, to prevent abuse.
//   kind = "approved"    → emails the approved student a welcome + login link.
//                          Caller MUST be an admin (verified via JWT + role).
//
// Env vars:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-provided)
//   RESEND_API_KEY   — set via: supabase secrets set RESEND_API_KEY=...
//   EMAIL_FROM       — optional, default 'הדרך לדירה <noreply@karnafnadlan.com>'
//   APP_URL          — optional, default 'https://tool.karnafnadlan.com'
//
// Deploy with:  supabase functions deploy notify-email --no-verify-jwt
// (JWT is verified manually inside, only where required.)

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FROM = Deno.env.get("EMAIL_FROM") || "הדרך לדירה <noreply@karnafnadlan.com>";
const APP_URL = Deno.env.get("APP_URL") || "https://tool.karnafnadlan.com";

interface Body {
  kind: "new_signup" | "approved";
  email?: string;
  displayName?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const body = (await req.json()) as Body;

    if (body.kind === "new_signup") {
      const email = (body.email || "").trim().toLowerCase();
      if (!email) return json({ error: "email required" }, 400);

      // Anti-abuse: only proceed if a matching pending profile actually exists.
      const { data: u } = await admin
        .from("profiles")
        .select("display_name, status, user_id, created_at")
        .eq("user_id", (await lookupUserId(admin, email)) ?? "00000000-0000-0000-0000-000000000000")
        .maybeSingle();
      if (!u || u.status !== "pending") {
        return json({ ok: true, skipped: "no matching pending profile" });
      }

      const display = body.displayName || u.display_name || email;
      const { data: admins } = await admin.rpc("admin_emails");
      const recipients: string[] = (admins || []).map((r: any) => r.email).filter(Boolean);
      if (!recipients.length) return json({ ok: true, skipped: "no admins" });

      await sendEmail(resendKey, recipients, "תלמיד חדש נרשם — ממתין לאישור", signupAdminHtml(display, email));
      return json({ ok: true, sent: recipients.length });
    }

    if (body.kind === "approved") {
      // Require an admin caller.
      const authHeader = req.headers.get("Authorization") || "";
      if (!authHeader.startsWith("Bearer ")) return json({ error: "auth required" }, 401);
      const userClient = createClient(supabaseUrl, serviceKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: caller } = await userClient.auth.getUser();
      if (!caller.user) return json({ error: "invalid auth" }, 401);
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: caller.user.id, _role: "admin" });
      if (!isAdmin) return json({ error: "forbidden" }, 403);

      const email = (body.email || "").trim();
      if (!email) return json({ error: "email required" }, 400);
      const display = body.displayName || email;

      await sendEmail(resendKey, [email], "אושרת! הגישה ל‑הדרך לדירה פתוחה", approvedHtml(display));
      return json({ ok: true });
    }

    return json({ error: "unknown kind" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

async function lookupUserId(admin: any, email: string): Promise<string | null> {
  const { data } = await admin.rpc("user_id_by_email", { _email: email });
  return (data as string | null) ?? null;
}

async function sendEmail(key: string | undefined, to: string[], subject: string, html: string) {
  if (!key) {
    console.warn("RESEND_API_KEY not set — email skipped:", subject, to);
    return;
  }
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Resend error ${resp.status}: ${t}`);
  }
}

function shell(inner: string): string {
  return `<div dir="rtl" style="font-family:Heebo,Arial,sans-serif;background:#f5f3ee;padding:24px">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e7e2d8">
      <div style="background:#1F5141;color:#fff;padding:20px 24px;font-size:18px;font-weight:700">הדרך לדירה</div>
      <div style="padding:24px;color:#1a2b22;font-size:15px;line-height:1.7">${inner}</div>
      <div style="padding:16px 24px;color:#8a8578;font-size:12px;border-top:1px solid #efece4">הדרך לדירה · המסע שלך לדירה הראשונה</div>
    </div>
  </div>`;
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#C6682A;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700">${label}</a>`;
}

function signupAdminHtml(display: string, email: string): string {
  return shell(`
    <p style="margin:0 0 12px">נרשם תלמיד חדש שממתין לאישורך:</p>
    <p style="margin:0 0 16px"><b>${display}</b><br><span style="color:#6b6657">${email}</span></p>
    <p style="margin:0 0 20px">היכנס לפאנל הניהול כדי לאשר או לדחות את הבקשה.</p>
    ${btn(`${APP_URL}/admin/users`, "אישור תלמידים")}
  `);
}

function approvedHtml(display: string): string {
  return shell(`
    <p style="margin:0 0 12px">שלום ${display},</p>
    <p style="margin:0 0 16px">החשבון שלך אושר — הגישה ל<b>הדרך לדירה</b> פתוחה. 🎉</p>
    <p style="margin:0 0 20px">המערכת תלווה אותך צעד אחר צעד: הגדרת יעד, תקציב, תוכנית עסקית, משכנתא ובדיקת נכס. מומלץ להתחיל בהגדרת היעד שלך.</p>
    ${btn(`${APP_URL}/?goal=1`, "כניסה והתחלת המסע")}
  `);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
