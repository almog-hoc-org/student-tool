import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BookOpen, CheckCircle2, Circle, Loader2, PlayCircle, Clock } from 'lucide-react';
import { getCourseBySlug, listLessonProgressForUser, type CourseDetail as CourseDetailType, type LessonProgress } from '@/lib/learn';
import { toast } from 'sonner';

export default function CourseDetail() {
  const { courseSlug } = useParams();
  const { user } = useAuth();
  const [detail, setDetail] = useState<CourseDetailType | null>(null);
  const [progress, setProgress] = useState<Map<string, LessonProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseSlug || !user) return;
    setLoading(true);
    (async () => {
      try {
        const d = await getCourseBySlug(courseSlug);
        setDetail(d);
        if (d) {
          const lessonIds = d.modules.flatMap(m => m.lessons.map(l => l.id));
          setProgress(await listLessonProgressForUser(user.id, lessonIds));
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'שגיאה בטעינה');
      } finally {
        setLoading(false);
      }
    })();
  }, [courseSlug, user]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground" dir="rtl">
        <Loader2 className="w-4 h-4 animate-spin" />
        טוען קורס...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-4" dir="rtl">
        <h1 className="text-xl font-bold">הקורס לא נמצא</h1>
        <Link to="/learn">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowRight className="w-4 h-4" />
            חזרה לקורסים
          </Button>
        </Link>
      </div>
    );
  }

  const totalLessons = detail.modules.reduce((s, m) => s + m.lessons.length, 0);
  const completed = Array.from(progress.values()).filter(p => p.status === 'completed').length;
  const pct = totalLessons ? Math.round((completed / totalLessons) * 100) : 0;

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <Link to="/learn">
          <Button variant="ghost" size="sm" className="gap-1 mb-2">
            <ArrowRight className="w-4 h-4" />
            כל הקורסים
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          {detail.course.title}
        </h1>
        {detail.course.description && (
          <p className="text-muted-foreground mt-2">{detail.course.description}</p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <Badge variant="secondary">{pct}% הושלם</Badge>
          <span className="text-sm text-muted-foreground">{completed} / {totalLessons} שיעורים</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden mt-3">
          <div className="bg-primary h-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {detail.modules.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            עדיין אין מודולים בקורס הזה.
          </CardContent>
        </Card>
      ) : (
        detail.modules.map(({ module, lessons }) => (
          <Card key={module.id}>
            <CardHeader>
              <CardTitle className="text-base">{module.title}</CardTitle>
              {module.description && (
                <p className="text-sm text-muted-foreground">{module.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {lessons.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין שיעורים פעילים במודול הזה.</p>
              ) : (
                lessons.map(lesson => {
                  const p = progress.get(lesson.id);
                  const status = p?.status ?? 'not_started';
                  return (
                    <Link
                      key={lesson.id}
                      to={`/learn/${detail.course.slug}/${module.slug}/${lesson.slug}`}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        ) : status === 'in_progress' ? (
                          <PlayCircle className="w-5 h-5 text-primary shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{lesson.title}</p>
                          {lesson.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{lesson.summary}</p>
                          )}
                        </div>
                      </div>
                      {lesson.estimated_minutes && (
                        <Badge variant="outline" className="gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {lesson.estimated_minutes} דק'
                        </Badge>
                      )}
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
