# Scripts

## ingest-drive.ts

Loads Google Drive folder content into Supabase pgvector for RAG.

### One-time setup

1. **Google Cloud**
   - Create project → enable **Drive API**
   - Create **Service Account** → download JSON key → save to `.secrets/sa.json`
   - Share your Drive course-content folder with the service account email (Viewer)

2. **Install deps**
   ```bash
   bun add googleapis pdf-parse mammoth dotenv
   ```

3. **Env vars** (`.env.local`, gitignored)
   ```
   SUPABASE_URL=https://<project>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=...           # from Supabase dashboard → settings → API
   GEMINI_API_KEY=...                      # aistudio.google.com/apikey
   GOOGLE_SERVICE_ACCOUNT_JSON=.secrets/sa.json
   ```

4. **Migration**
   - Apply `supabase/migrations/20260528000000_pgvector_knowledge_sla.sql` first
     (creates `vector` extension + `knowledge_chunks` table + `match_chunks` RPC)

### Run

```bash
bun run scripts/ingest-drive.ts <DRIVE_FOLDER_ID>
```

`DRIVE_FOLDER_ID` is the part after `/folders/` in the folder URL.

Idempotent — re-running replaces a file's chunks when content changes.

### Edge function deployment

```bash
supabase functions deploy chat-ai
supabase secrets set GEMINI_API_KEY=<key>
```

After ingest finishes, the `/chat` page will start citing sources automatically.
