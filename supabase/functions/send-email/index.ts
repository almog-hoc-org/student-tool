// Supabase Edge Function — Resend-based email sender.
//
// Two modes of use:
//
// (A) Direct call (admin-initiated push, password reset, etc.):
//     POST /functions/v1/send-email
//     { to: string, subject: string, html: string, text?: string }
//     → Requires admin JWT.
//
// (B) Database webhook (auto-fire on notifications INSERT):
//     Configure a Supabase Database Webhook:
//       table: notifications
//       events: INSERT
//       method: POST
//       url: <function url>?source=webhook
//       headers: x-webhook-secret: <secret>
//     The webhook sends the inserted row in the body. We resolve the user's
//     email, render a basic template, send the mail, then PATCH email_sent_at.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const FROM = Deno.env.get('EMAIL_FROM') ?? 'הדרך לדירה <noreply@example.com>';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors(new Response('ok'));

  try {
    const url = new URL(req.url);
    const source = url.searchParams.get('source');

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return cors(new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 503 }));
    }

    if (source === 'webhook') {
      return await handleWebhook(req, resendKey);
    }
    return await handleDirect(req, resendKey);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return cors(new Response(JSON.stringify({ error: msg }), { status: 500 }));
  }
});

async function handleDirect(req: Request, resendKey: string): Promise<Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return cors(new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }));
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return cors(new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }));
  }

  // admin-only: caller must be admin to send arbitrary emails
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id);
  if (!roles?.some(r => r.role === 'admin')) {
    return cors(new Response(JSON.stringify({ error: 'admin role required' }), { status: 403 }));
  }

  const body = await req.json() as { to: string; subject: string; html?: string; text?: string };
  if (!body.to || !body.subject || (!body.html && !body.text)) {
    return cors(new Response(JSON.stringify({ error: 'to, subject, and html or text required' }), { status: 400 }));
  }

  const result = await sendResend(resendKey, body);
  return cors(new Response(JSON.stringify(result), { status: 200 }));
}

async function handleWebhook(req: Request, resendKey: string): Promise<Response> {
  // Verify webhook secret
  const expected = Deno.env.get('NOTIFICATIONS_WEBHOOK_SECRET');
  const got = req.headers.get('x-webhook-secret');
  if (!expected || got !== expected) {
    return new Response(JSON.stringify({ error: 'invalid webhook secret' }), { status: 401 });
  }

  const payload = await req.json() as { type: string; record: NotificationRow };
  if (payload.type !== 'INSERT' || !payload.record) {
    return new Response('ignored', { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Look up user email
  const { data: user } = await supabase.auth.admin.getUserById(payload.record.user_id);
  const to = user?.user?.email;
  if (!to) return new Response('no user email', { status: 200 });

  const baseUrl = Deno.env.get('APP_BASE_URL') ?? '';
  const link = payload.record.link ? `${baseUrl}${payload.record.link}` : baseUrl;

  const html = renderTemplate({
    title: payload.record.title,
    body: payload.record.body ?? '',
    link,
    linkLabel: payload.record.link ? 'פתח בפורטל' : null,
  });

  try {
    await sendResend(resendKey, {
      to,
      subject: payload.record.title,
      html,
    });
    await supabase
      .from('notifications')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', payload.record.id);
  } catch (err) {
    console.error('email send failed', err);
    return new Response(JSON.stringify({ error: 'send failed' }), { status: 500 });
  }

  return new Response('ok', { status: 200 });
}

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  category: string | null;
  link: string | null;
}

interface EmailInput { to: string; subject: string; html?: string; text?: string }
async function sendResend(apiKey: string, input: EmailInput) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Resend failed ${r.status}: ${text}`);
  }
  return await r.json();
}

interface TemplateInput {
  title: string;
  body: string;
  link?: string;
  linkLabel?: string | null;
}
function renderTemplate({ title, body, link, linkLabel }: TemplateInput): string {
  return `<!doctype html>
<html lang="he" dir="rtl">
  <head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
  <body style="margin:0;padding:0;background:#f5f7fb;font-family:-apple-system,Segoe UI,Arial,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:32px 16px">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6e9f2">
          <tr><td style="padding:32px 32px 8px 32px">
            <h1 style="margin:0;font-size:20px;color:#1e3a5f">${escapeHtml(title)}</h1>
          </td></tr>
          <tr><td style="padding:8px 32px 24px 32px;color:#444;font-size:15px;line-height:1.6;white-space:pre-wrap">${escapeHtml(body)}</td></tr>
          ${link && linkLabel ? `
          <tr><td style="padding:0 32px 32px 32px">
            <a href="${escapeAttr(link)}" style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px">${escapeHtml(linkLabel)}</a>
          </td></tr>` : ''}
          <tr><td style="padding:16px 32px;background:#fafbff;color:#888;font-size:12px;text-align:center">
            ארגז הכלים — הדרך לדירה
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
}
function escapeAttr(s: string): string { return escapeHtml(s); }

function cors(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, apikey, x-webhook-secret');
  return new Response(res.body, { status: res.status, headers });
}
