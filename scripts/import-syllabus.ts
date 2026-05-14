/**
 * One-shot CLI to bootstrap course content from a JSON syllabus file.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/import-syllabus.ts <path-to-syllabus.json>
 *
 * Syllabus JSON shape:
 *   {
 *     "course": { "slug": "way-to-apartment", "title": "הדרך לדירה", "description": "...", "is_published": true },
 *     "modules": [
 *       {
 *         "slug": "intro",
 *         "title": "פתיחה",
 *         "description": "...",
 *         "order_index": 1,
 *         "lessons": [
 *           {
 *             "slug": "welcome",
 *             "title": "ברוכים הבאים",
 *             "summary": "...",
 *             "body_md": "...",
 *             "video_url": "https://...",
 *             "transcript": "...",
 *             "estimated_minutes": 8,
 *             "linked_tool": "budget",
 *             "order_index": 1,
 *             "is_published": true,
 *             "attachments": [{ "name": "PDF", "url": "https://..." }]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 *
 * Idempotent: re-running upserts rows by slug.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface LessonInput {
  slug: string;
  title: string;
  summary?: string;
  body_md?: string;
  video_url?: string;
  transcript?: string;
  attachments?: Array<{ name: string; url: string; type?: string }>;
  linked_tool?: string;
  estimated_minutes?: number;
  order_index?: number;
  is_published?: boolean;
}

interface ModuleInput {
  slug: string;
  title: string;
  description?: string;
  order_index?: number;
  lessons: LessonInput[];
}

interface SyllabusInput {
  course: {
    slug: string;
    title: string;
    description?: string;
    cover_image_url?: string;
    is_published?: boolean;
  };
  modules: ModuleInput[];
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: tsx scripts/import-syllabus.ts <syllabus.json>');
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const raw = readFileSync(resolve(file), 'utf8');
  const syllabus = JSON.parse(raw) as SyllabusInput;

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Upsert course
  console.log(`Upserting course "${syllabus.course.slug}"...`);
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .upsert(
      {
        slug: syllabus.course.slug,
        title: syllabus.course.title,
        description: syllabus.course.description ?? null,
        cover_image_url: syllabus.course.cover_image_url ?? null,
        is_published: syllabus.course.is_published ?? false,
      },
      { onConflict: 'slug' },
    )
    .select('*')
    .single();

  if (courseErr || !course) {
    console.error('Course upsert failed:', courseErr);
    process.exit(1);
  }

  // 2. Modules + lessons
  for (const m of syllabus.modules) {
    console.log(`  Upserting module "${m.slug}"...`);
    const { data: mod, error: modErr } = await supabase
      .from('modules')
      .upsert(
        {
          course_id: course.id,
          slug: m.slug,
          title: m.title,
          description: m.description ?? null,
          order_index: m.order_index ?? 0,
        },
        { onConflict: 'course_id,slug' },
      )
      .select('*')
      .single();

    if (modErr || !mod) {
      console.error('  Module upsert failed:', modErr);
      continue;
    }

    for (const l of m.lessons) {
      console.log(`    Upserting lesson "${l.slug}"...`);
      const { error: lErr } = await supabase
        .from('lessons')
        .upsert(
          {
            module_id: mod.id,
            slug: l.slug,
            title: l.title,
            summary: l.summary ?? null,
            body_md: l.body_md ?? null,
            video_url: l.video_url ?? null,
            transcript: l.transcript ?? null,
            attachments: l.attachments ?? null,
            linked_tool: l.linked_tool ?? null,
            estimated_minutes: l.estimated_minutes ?? null,
            order_index: l.order_index ?? 0,
            is_published: l.is_published ?? true,
          },
          { onConflict: 'module_id,slug' },
        );

      if (lErr) {
        console.error('    Lesson upsert failed:', lErr);
      }
    }
  }

  console.log('Done.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
