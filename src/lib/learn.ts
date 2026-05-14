import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Course = Database['public']['Tables']['courses']['Row'];
export type Module = Database['public']['Tables']['modules']['Row'];
export type Lesson = Database['public']['Tables']['lessons']['Row'];
export type LessonProgress = Database['public']['Tables']['lesson_progress']['Row'];
export type LessonStatus = Database['public']['Enums']['lesson_status'];

export interface CourseWithProgress {
  course: Course;
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  lastActivity: string | null;
}

export interface ModuleWithLessons {
  module: Module;
  lessons: Lesson[];
}

export interface CourseDetail {
  course: Course;
  modules: ModuleWithLessons[];
}

export async function listEnrolledCourses(userId: string): Promise<CourseWithProgress[]> {
  const { data: progressRows, error: progressErr } = await supabase
    .rpc('user_course_progress', { _user_id: userId });
  if (progressErr) throw progressErr;

  if (!progressRows || progressRows.length === 0) return [];

  const courseIds = progressRows.map(r => r.course_id);
  const { data: courses, error: coursesErr } = await supabase
    .from('courses')
    .select('*')
    .in('id', courseIds);
  if (coursesErr) throw coursesErr;

  const courseById = new Map((courses ?? []).map(c => [c.id, c]));
  return progressRows
    .map(r => {
      const course = courseById.get(r.course_id);
      if (!course) return null;
      return {
        course,
        totalLessons: r.total_lessons,
        completedLessons: r.completed_lessons,
        inProgressLessons: r.in_progress_lessons,
        lastActivity: r.last_activity,
      } satisfies CourseWithProgress;
    })
    .filter((x): x is CourseWithProgress => x !== null);
}

export async function getCourseBySlug(slug: string): Promise<CourseDetail | null> {
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (!course) return null;

  const { data: modules, error: modErr } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', course.id)
    .order('order_index', { ascending: true });
  if (modErr) throw modErr;

  if (!modules || modules.length === 0) {
    return { course, modules: [] };
  }

  const { data: lessons, error: lessonsErr } = await supabase
    .from('lessons')
    .select('*')
    .in('module_id', modules.map(m => m.id))
    .eq('is_published', true)
    .order('order_index', { ascending: true });
  if (lessonsErr) throw lessonsErr;

  const lessonsByModule = new Map<string, Lesson[]>();
  for (const lesson of lessons ?? []) {
    const list = lessonsByModule.get(lesson.module_id) ?? [];
    list.push(lesson);
    lessonsByModule.set(lesson.module_id, list);
  }

  return {
    course,
    modules: modules.map(m => ({
      module: m,
      lessons: lessonsByModule.get(m.id) ?? [],
    })),
  };
}

export async function getLessonBySlugs(
  moduleSlug: string,
  lessonSlug: string,
): Promise<{ lesson: Lesson; module: Module; course: Course } | null> {
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select(`
      *,
      modules!inner ( *, courses!inner ( * ) )
    `)
    .eq('slug', lessonSlug)
    .eq('modules.slug', moduleSlug)
    .maybeSingle();
  if (error) throw error;
  if (!lesson) return null;

  // The relational select returns nested objects — extract them
  const moduleData = (lesson as unknown as { modules: Module & { courses: Course } }).modules;
  if (!moduleData) return null;

  return {
    lesson: { ...lesson, modules: undefined } as Lesson,
    module: { ...moduleData, courses: undefined } as Module,
    course: moduleData.courses,
  };
}

export async function getLessonProgress(
  userId: string,
  lessonId: string,
): Promise<LessonProgress | null> {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function markLessonStarted(userId: string, lessonId: string): Promise<void> {
  const now = new Date().toISOString();
  await supabase
    .from('lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      status: 'in_progress',
      started_at: now,
      updated_at: now,
    }, { onConflict: 'user_id,lesson_id', ignoreDuplicates: false });
}

export async function markLessonCompleted(userId: string, lessonId: string): Promise<void> {
  const now = new Date().toISOString();
  await supabase
    .from('lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      status: 'completed',
      completed_at: now,
      updated_at: now,
    }, { onConflict: 'user_id,lesson_id', ignoreDuplicates: false });
}

export async function listLessonProgressForUser(
  userId: string,
  lessonIds: string[],
): Promise<Map<string, LessonProgress>> {
  if (lessonIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds);
  if (error) throw error;
  return new Map((data ?? []).map(p => [p.lesson_id, p]));
}
