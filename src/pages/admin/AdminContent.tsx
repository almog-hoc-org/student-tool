import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowRight, BookOpen, ChevronDown, ChevronLeft, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Course = Database['public']['Tables']['courses']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];

export default function AdminContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Record<string, Module[]>>({});
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editSummary, setEditSummary] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { reload(); }, []);

  async function reload() {
    setLoading(true);
    try {
      const { data: c } = await supabase.from('courses').select('*').order('created_at', { ascending: true });
      setCourses(c ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  }

  async function expandCourse(courseId: string) {
    const next = new Set(expandedCourses);
    if (next.has(courseId)) next.delete(courseId);
    else {
      next.add(courseId);
      if (!modules[courseId]) {
        const { data } = await supabase
          .from('modules').select('*').eq('course_id', courseId).order('order_index');
        setModules(m => ({ ...m, [courseId]: data ?? [] }));
      }
    }
    setExpandedCourses(next);
  }

  async function expandModule(moduleId: string) {
    const next = new Set(expandedModules);
    if (next.has(moduleId)) next.delete(moduleId);
    else {
      next.add(moduleId);
      if (!lessons[moduleId]) {
        const { data } = await supabase
          .from('lessons').select('*').eq('module_id', moduleId).order('order_index');
        setLessons(l => ({ ...l, [moduleId]: data ?? [] }));
      }
    }
    setExpandedModules(next);
  }

  function startEdit(lesson: Lesson) {
    setEditingLesson(lesson);
    setEditSummary(lesson.summary ?? '');
    setEditBody(lesson.body_md ?? '');
    setEditVideoUrl(lesson.video_url ?? '');
  }

  async function saveEdit() {
    if (!editingLesson) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          summary: editSummary || null,
          body_md: editBody || null,
          video_url: editVideoUrl || null,
        })
        .eq('id', editingLesson.id);
      if (error) throw error;
      // Update local state
      setLessons(l => ({
        ...l,
        [editingLesson.module_id]: (l[editingLesson.module_id] ?? []).map(x =>
          x.id === editingLesson.id
            ? { ...x, summary: editSummary || null, body_md: editBody || null, video_url: editVideoUrl || null }
            : x,
        ),
      }));
      toast.success('השיעור עודכן');
      setEditingLesson(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(lesson: Lesson) {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ is_published: !lesson.is_published })
        .eq('id', lesson.id);
      if (error) throw error;
      setLessons(l => ({
        ...l,
        [lesson.module_id]: (l[lesson.module_id] ?? []).map(x =>
          x.id === lesson.id ? { ...x, is_published: !lesson.is_published } : x,
        ),
      }));
      toast.success(lesson.is_published ? 'השיעור הוסתר' : 'השיעור פורסם');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה');
    }
  }

  if (editingLesson) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto" dir="rtl">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setEditingLesson(null)}>
          <ArrowRight className="w-4 h-4" />
          חזרה לרשימה
        </Button>
        <h1 className="text-xl font-bold">{editingLesson.title}</h1>
        <Card>
          <CardContent className="space-y-3 p-6">
            <div>
              <label className="text-sm font-medium">תקציר</label>
              <Input value={editSummary} onChange={e => setEditSummary(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">קישור וידאו (embed URL)</label>
              <Input value={editVideoUrl} onChange={e => setEditVideoUrl(e.target.value)} placeholder="https://..." dir="ltr" />
            </div>
            <div>
              <label className="text-sm font-medium">תוכן השיעור (Markdown)</label>
              <Textarea
                rows={20}
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={saveEdit} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                שמור
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div>
        <Link to="/admin">
          <Button variant="ghost" size="sm" className="gap-1 mb-2">
            <ArrowRight className="w-4 h-4" />
            חזרה
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          ניהול תוכן קורסים
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ערוך שיעורים קיימים. ליצירה ראשונית של קורס/מודולים — השתמש ב-<code className="bg-muted px-1 text-xs">scripts/import-syllabus.ts</code>.
          אחרי שינוי תוכן שיעור, הרץ <code className="bg-muted px-1 text-xs">scripts/embed-content.ts</code> כדי לעדכן את ה-RAG.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">טוען...</p>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            אין קורסים. הרץ <code className="bg-muted px-1">scripts/import-syllabus.ts</code> כדי להתחיל.
          </CardContent>
        </Card>
      ) : (
        courses.map(course => (
          <Card key={course.id}>
            <CardHeader className="cursor-pointer" onClick={() => expandCourse(course.id)}>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {expandedCourses.has(course.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronLeft className="w-4 h-4" />
                  )}
                  {course.title}
                  {!course.is_published && <Badge variant="outline">טיוטה</Badge>}
                </span>
              </CardTitle>
            </CardHeader>
            {expandedCourses.has(course.id) && (
              <CardContent className="space-y-2">
                {(modules[course.id] ?? []).map(mod => (
                  <div key={mod.id} className="rounded-lg border">
                    <button
                      type="button"
                      onClick={() => expandModule(mod.id)}
                      className="w-full p-3 text-right flex items-center justify-between hover:bg-muted/50 transition"
                    >
                      <span className="flex items-center gap-2 font-medium text-sm">
                        {expandedModules.has(mod.id) ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronLeft className="w-3 h-3" />
                        )}
                        {mod.title}
                      </span>
                    </button>
                    {expandedModules.has(mod.id) && (
                      <div className="border-t p-2 space-y-1">
                        {(lessons[mod.id] ?? []).map(lesson => (
                          <div key={lesson.id} className="flex items-center justify-between gap-2 p-2 hover:bg-muted/30 rounded">
                            <button
                              type="button"
                              onClick={() => startEdit(lesson)}
                              className="flex-1 text-right text-sm"
                            >
                              {lesson.title}
                              {lesson.summary && (
                                <span className="text-xs text-muted-foreground block truncate mt-0.5">
                                  {lesson.summary}
                                </span>
                              )}
                            </button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => togglePublished(lesson)}
                              title={lesson.is_published ? 'הסתר' : 'פרסם'}
                            >
                              {lesson.is_published ? (
                                <Eye className="w-4 h-4 text-green-500" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
