/**
 * Ingest Google Drive folder → Supabase pgvector knowledge_chunks.
 *
 * Usage:
 *   bun run scripts/ingest-drive.ts <FOLDER_ID>
 *
 * Required env (in .env.local — NOT committed):
 *   SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *   GEMINI_API_KEY=...
 *   GOOGLE_SERVICE_ACCOUNT_JSON=path/to/service-account.json
 *
 * Setup (one-time):
 *   1. Create a Google Cloud project.
 *   2. Enable Drive API.
 *   3. Create a Service Account, download JSON key.
 *   4. Share the Drive folder with the service account email (Viewer).
 *   5. `bun add googleapis pdf-parse mammoth @supabase/supabase-js dotenv`
 *
 * What it does:
 *   - Lists every file under the folder (recursively).
 *   - For supported types (PDF / DOCX / TXT / MD / Google Doc), extracts text.
 *   - Chunks text (~500 tokens with 50 overlap).
 *   - Embeds each chunk via Gemini text-embedding-004.
 *   - Upserts into knowledge_chunks (idempotent: source_id+chunk_index unique).
 *
 * Re-run is safe — chunks are replaced when a file's content changes.
 */

import 'dotenv/config';
import { readFileSync, existsSync } from 'node:fs';
import { google, drive_v3 } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
// @ts-ignore — pdf-parse has no types
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const FOLDER_ID = process.argv[2];
if (!FOLDER_ID) {
  console.error('Usage: bun run scripts/ingest-drive.ts <FOLDER_ID>');
  process.exit(1);
}

const SUPABASE_URL = required('SUPABASE_URL');
const SUPABASE_KEY = required('SUPABASE_SERVICE_ROLE_KEY');
const GEMINI_KEY = required('GEMINI_API_KEY');
const SA_PATH = required('GOOGLE_SERVICE_ACCOUNT_JSON');
if (!existsSync(SA_PATH)) throw new Error(`Service account JSON not found: ${SA_PATH}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const auth = new google.auth.GoogleAuth({
  keyFile: SA_PATH,
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});
const drive = google.drive({ version: 'v3', auth });

const CHUNK_TOKENS = 500;
const CHUNK_OVERLAP = 50;

// Rough token estimate: 1 token ≈ 4 chars (Hebrew slightly more; safe enough).
const CHARS_PER_CHUNK = CHUNK_TOKENS * 4;
const CHARS_OVERLAP = CHUNK_OVERLAP * 4;

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
}

async function listFilesRecursive(folderId: string): Promise<DriveFile[]> {
  const all: DriveFile[] = [];
  const queue = [folderId];
  while (queue.length) {
    const current = queue.shift()!;
    let pageToken: string | undefined;
    do {
      const res = await drive.files.list({
        q: `'${current}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
        pageSize: 200,
        pageToken,
      });
      for (const f of res.data.files || []) {
        if (!f.id || !f.name || !f.mimeType) continue;
        if (f.mimeType === 'application/vnd.google-apps.folder') {
          queue.push(f.id);
        } else {
          all.push(f as DriveFile);
        }
      }
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);
  }
  return all;
}

async function downloadBinary(fileId: string): Promise<Buffer> {
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' },
  );
  return Buffer.from(res.data as ArrayBuffer);
}

async function exportGoogleDoc(fileId: string, mimeType: string): Promise<string> {
  const res = await drive.files.export(
    { fileId, mimeType },
    { responseType: 'text' },
  );
  return (res.data as string) || '';
}

async function extractText(file: DriveFile): Promise<string> {
  try {
    switch (file.mimeType) {
      case 'application/pdf': {
        const buf = await downloadBinary(file.id);
        const parsed = await pdfParse(buf);
        return parsed.text || '';
      }
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        const buf = await downloadBinary(file.id);
        const out = await mammoth.extractRawText({ buffer: buf });
        return out.value || '';
      }
      case 'text/plain':
      case 'text/markdown': {
        const buf = await downloadBinary(file.id);
        return buf.toString('utf8');
      }
      case 'application/vnd.google-apps.document':
        return exportGoogleDoc(file.id, 'text/plain');
      default:
        return '';
    }
  } catch (e) {
    console.warn(`[skip] ${file.name}: ${(e as Error).message}`);
    return '';
  }
}

function chunkText(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= CHARS_PER_CHUNK) return cleaned ? [cleaned] : [];
  const chunks: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    chunks.push(cleaned.slice(i, i + CHARS_PER_CHUNK));
    i += CHARS_PER_CHUNK - CHARS_OVERLAP;
  }
  return chunks;
}

async function embed(text: string): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_DOCUMENT',
    }),
  });
  if (!res.ok) throw new Error(`Embed failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.embedding.values as number[];
}

async function upsertChunks(file: DriveFile, chunks: string[]) {
  // Remove old chunks for this source first (handles file edits cleanly)
  await supabase.from('knowledge_chunks').delete().eq('source_id', file.id);

  for (let i = 0; i < chunks.length; i++) {
    const content = chunks[i];
    const embedding = await embed(content);
    const { error } = await supabase.from('knowledge_chunks').insert({
      source_id: file.id,
      source_file: file.name,
      chunk_index: i,
      content,
      embedding,
      metadata: { mime_type: file.mimeType, modified_time: file.modifiedTime },
    });
    if (error) throw error;
    process.stdout.write('.');
  }
}

async function main() {
  console.log(`[ingest] folder=${FOLDER_ID}`);
  const files = await listFilesRecursive(FOLDER_ID);
  console.log(`[ingest] ${files.length} files found`);

  let totalChunks = 0;
  let processed = 0;
  for (const file of files) {
    const text = await extractText(file);
    if (!text || text.trim().length < 100) {
      console.log(`[skip] ${file.name} (empty / too short)`);
      continue;
    }
    const chunks = chunkText(text);
    process.stdout.write(`[file] ${file.name} (${chunks.length} chunks) `);
    await upsertChunks(file, chunks);
    process.stdout.write('\n');
    totalChunks += chunks.length;
    processed++;
  }
  console.log(`[done] ${processed} files, ${totalChunks} chunks ingested`);
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env: ${name}`);
    process.exit(1);
  }
  return v;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
