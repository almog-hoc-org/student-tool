/**
 * Ingest a Drive folder that is shared as "Anyone with the link can view".
 * Uses an API key (no service-account JSON, no OAuth flow).
 *
 * Required env vars:
 *   DRIVE_API_KEY
 *   DRIVE_FOLDER_ID
 *   GEMINI_API_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run:
 *   DRIVE_API_KEY=... DRIVE_FOLDER_ID=... GEMINI_API_KEY=... \
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx tsx scripts/ingest-drive-public.ts
 */

import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
import mammoth from 'mammoth';
const req = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse: (b: Buffer) => Promise<{ text: string }> = req('pdf-parse');

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const CHUNK_WORDS = 280;
const CHUNK_OVERLAP = 40;

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
}

const env = (k: string): string => {
  const v = process.env[k];
  if (!v) { console.error(`Missing env ${k}`); process.exit(1); }
  return v;
};

const KEY = env('DRIVE_API_KEY');
const ROOT = env('DRIVE_FOLDER_ID');
const GEMINI_KEY = env('GEMINI_API_KEY');
const SB_URL = env('SUPABASE_URL');
const SB_SRK = env('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SB_URL, SB_SRK, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function listFolder(id: string): Promise<DriveFile[]> {
  const u = `${DRIVE_API}/files?q='${id}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,parents)&pageSize=200&key=${KEY}`;
  const r = await fetch(u);
  if (!r.ok) throw new Error(`list ${id}: ${r.status} ${await r.text()}`);
  const j = await r.json();
  return j.files as DriveFile[];
}

async function listRecursive(rootId: string, path: string[] = []): Promise<Array<DriveFile & { path: string }>> {
  const out: Array<DriveFile & { path: string }> = [];
  const children = await listFolder(rootId);
  for (const f of children) {
    if (f.mimeType === 'application/vnd.google-apps.folder') {
      out.push(...await listRecursive(f.id, [...path, f.name]));
    } else {
      out.push({ ...f, path: path.join(' / ') });
    }
  }
  return out;
}

async function downloadBinary(id: string): Promise<Buffer> {
  const r = await fetch(`${DRIVE_API}/files/${id}?alt=media&key=${KEY}`);
  if (!r.ok) throw new Error(`download ${id}: ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

async function exportGoogleDoc(id: string): Promise<string> {
  const r = await fetch(`${DRIVE_API}/files/${id}/export?mimeType=text/plain&key=${KEY}`);
  if (!r.ok) throw new Error(`export ${id}: ${r.status}`);
  return await r.text();
}

async function extractText(f: DriveFile): Promise<string | null> {
  switch (f.mimeType) {
    case 'application/vnd.google-apps.document':
      return await exportGoogleDoc(f.id);
    case 'application/pdf': {
      const buf = await downloadBinary(f.id);
      const parsed = await pdfParse(buf);
      return parsed.text as string;
    }
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      const buf = await downloadBinary(f.id);
      const { value } = await mammoth.extractRawText({ buffer: buf });
      return value;
    }
    case 'text/plain':
    case 'text/markdown':
    case 'text/x-markdown': {
      const buf = await downloadBinary(f.id);
      return buf.toString('utf8');
    }
    default:
      return null; // images, spreadsheets, video, slides — skipped
  }
}

function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const out: string[] = [];
  let i = 0;
  while (i < words.length) {
    out.push(words.slice(i, i + CHUNK_WORDS).join(' '));
    if (i + CHUNK_WORDS >= words.length) break;
    i += CHUNK_WORDS - CHUNK_OVERLAP;
  }
  return out;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function embed(text: string): Promise<number[]> {
  let backoff = 2000;
  for (let attempt = 0; attempt < 6; attempt++) {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text }] },
          outputDimensionality: 768,
        }),
      },
    );
    if (r.ok) {
      await sleep(800); // gentle pace between successes
      return (await r.json()).embedding.values as number[];
    }
    if (r.status === 429 || r.status >= 500) {
      console.log(`    rate-limit (${r.status}), backing off ${backoff}ms...`);
      await sleep(backoff);
      backoff = Math.min(backoff * 2, 30000);
      continue;
    }
    throw new Error(`embed: ${r.status} ${await r.text()}`);
  }
  throw new Error('embed: exhausted retries');
}

async function main() {
  console.log(`Scanning folder ${ROOT}...`);
  const files = await listRecursive(ROOT);
  console.log(`Found ${files.length} files total (will skip unsupported types).`);

  let processed = 0, skipped = 0, chunksTotal = 0;
  for (const f of files) {
    const displayPath = f.path ? `${f.path} / ${f.name}` : f.name;
    try {
      const text = await extractText(f);
      if (!text || text.trim().length < 50) {
        console.log(`  skip [${f.mimeType}] ${displayPath}`);
        skipped++;
        continue;
      }

      const chunks = chunkText(text);
      if (chunks.length === 0) { skipped++; continue; }

      // Replace previous chunks for this file (idempotent re-runs)
      await supabase.from('knowledge_chunks').delete().eq('source_id', f.id);

      const rows = [];
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await embed(chunks[i]);
        rows.push({
          source_file: displayPath,
          source_id: f.id,
          chunk_index: i,
          content: chunks[i],
          embedding,
          metadata: { drive_path: f.path, mime: f.mimeType },
        });
      }
      const { error } = await supabase.from('knowledge_chunks').insert(rows);
      if (error) throw new Error(`db insert: ${error.message}`);
      console.log(`  ok   ${displayPath} → ${chunks.length} chunks`);
      processed++;
      chunksTotal += chunks.length;
    } catch (err) {
      console.error(`  fail ${displayPath}: ${(err as Error).message}`);
      skipped++;
    }
  }

  console.log(`\nDone. processed=${processed} skipped=${skipped} chunks=${chunksTotal}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
