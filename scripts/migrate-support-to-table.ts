/**
 * One-shot migration: move legacy support tickets from `user_data` (JSONB blob
 * under tool_key='support_requests') into the new first-class tables
 * `support_tickets` + `support_ticket_messages`.
 *
 * Run AFTER applying `20260514100000_support_tickets.sql`.
 *
 * Requirements:
 * - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in env (NEVER ship to client)
 * - Run via: `npx tsx scripts/migrate-support-to-table.ts`
 *
 * Idempotency: re-running is safe — we skip tickets that already exist by id.
 */

import { createClient } from '@supabase/supabase-js';

interface LegacySupportRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  displayName: string;
  email: string;
  issueType: string;
  tool: string;
  subject: string;
  description: string;
  priority: 'low' | 'normal' | 'high';
  status: 'open' | 'resolved';
  contextPath: string;
}

interface UserDataRow {
  user_id: string;
  data: LegacySupportRequest[] | null;
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('Loading legacy support_requests blobs...');
  const { data: rows, error } = await supabase
    .from('user_data')
    .select('user_id, data')
    .eq('tool_key', 'support_requests');

  if (error) {
    console.error('Failed to read user_data:', error);
    process.exit(1);
  }

  const allLegacyTickets: LegacySupportRequest[] = ((rows as UserDataRow[] | null) ?? []).flatMap(row =>
    Array.isArray(row.data) ? row.data : [],
  );

  console.log(`Found ${allLegacyTickets.length} legacy tickets across ${rows?.length ?? 0} users.`);

  let migrated = 0;
  let skipped = 0;

  for (const t of allLegacyTickets) {
    const newStatus = t.status === 'resolved' ? 'resolved' : 'open';
    const newPriority = t.priority === 'high' ? 'high' : t.priority === 'low' ? 'low' : 'normal';

    const { error: insertErr } = await supabase.from('support_tickets').upsert({
      id: t.id,
      user_id: t.userId,
      subject: t.subject,
      description: t.description,
      issue_type: t.issueType,
      tool: t.tool,
      priority: newPriority,
      status: newStatus,
      context_path: t.contextPath,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
      resolved_at: newStatus === 'resolved' ? t.updatedAt : null,
    }, { onConflict: 'id', ignoreDuplicates: true });

    if (insertErr) {
      console.warn(`  skip ticket ${t.id}: ${insertErr.message}`);
      skipped++;
    } else {
      migrated++;
    }
  }

  console.log(`Migrated ${migrated}, skipped ${skipped}.`);
  console.log('To delete the legacy blobs, run AFTER verifying:');
  console.log(`  delete from user_data where tool_key = 'support_requests';`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
