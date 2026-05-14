import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import {
  getLessonBySlugs,
  getLessonProgress,
  markLessonStarted,
  markLessonCompleted,
  type Lesson as LessonType,
  type Module,
  type Course,
  type LessonProgress,
} from '@/lib/learn';
import { logActivity } from '@/lib/activity';
import { toast } from 'sonner';

const TOOL_ROUTES: Record<string, string> = {
  budget: '/',
  mortgage: '/mortgage',
  business_plan: '/business-plan',
};

const TOOL_LABELS: Record<string, string> = {
  budget: 'מחשבון תקציב',
  mortgage: 'מחשבון משכנתא',
  business_plan: 'תוכנית עסקית',
};

interface Attachment { name: string; url: string; type?: string }

function isAttachmentArray(value: unknown): value is Attachment[] {
  return Array.isArray(value) && value.every(v => v && typeof v === 'object' && 'name' in v && 'url' in v);
}

export default function Lesson() {
  const { courseSlug, moduleSlug, lessonSlug } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<{ lesson: LessonType; module: Module; course: Course } | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!moduleSlug || !lessonSlug || !user) return;
    setLoading(true);
    (async () => {
      try {
        const result = await getLessonBySlugs(moduleSlug, lessonSlug);
        setData(result);
        if (result) {
          const p = await getLessonProgress(user.id, result.lesson.id);
          setProgress(p);
          if (!p || p.status === 'not_started') {
            await markLessonStarted(user.id, result.lesson.id);
            logActivity({ userId: user.id, type: 'lesson_viewed', resourceId: result.lesson.id });
          }
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'שגיאה בטעינה');
      } finally {
        setLoading(false);
      }
    })();
  }, [moduleSlug, lessonSlug, user]);

  const complete = async () => {
    if (!user || !data) return;
    setCompleting(true);
    try {
      await markLessonCompleted(user.id, data.lesson.id);
      logActivity({ userId: user.id, type: 'lesson_completed', resourceId: data.lesson.id });
      setProgress(prev => prev
        ? { ...prev, status: 'completed', completed_at: new Date().toISOString() }
        : null);
      toast.success('סומן כהושלם');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground" dir="rtl">
        <Loader2 className="w-4 h-4 animate-spin" />
        טוען...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-3" dir="rtl">
        <h1 className="text-xl font-bold">השיעור לא נמצא</h1>
        <Link to={`/learn${courseSlug ? `/${courseSlug}` : ''}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowRight className="w-4 h-4" />
            חזרה
          </Button>
        </Link>
      </div>
    );
  }

  const { lesson, module, course } = data;
  const attachments = isAttachmentArray(lesson.attachments) ? lesson.attachments : [];
  const isCompleted = progress?.status === 'completed';

  return (
    <div className="space-y-6 max-w-3xl mx-auto" dir="rtl">
      <div>
        <Link to={`/learn/${course.slug}`}>
          <Button variant="ghost" size="sm" className="gap-1 mb-2">
            <ArrowRight className="w-4 h-4" />
            {course.title} · {module.title}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        {lesson.summary && <p className="text-muted-foreground mt-2">{lesson.summary}</p>}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {lesson.estimated_minutes && (
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              {lesson.estimated_minutes} דקות
            </Badge>
          )}
          {isCompleted && (
            <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-700 dark:text-green-300">
              <CheckCircle2 className="w-3 h-3" />
              הושלם
            </Badge>
          )}
        </div>
      </div>

      {lesson.video_url && (
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            <div className="aspect-video">
              <iframe
                src={lesson.video_url}
                title={lesson.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </CardContent>
        </Card>
      )}

      {lesson.body_md && (
        <Card>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none rtl:prose-headings:text-right py-6">
            <ReactMarkdown>{lesson.body_md}</ReactMarkdown>
          </CardContent>
        </Card>
      )}

      {attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">חומר נלווה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {attachments.map(a => (
              <a
                key={a.url}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition"
              >
                <span className="font-medium">{a.name}</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      {lesson.linked_tool && TOOL_ROUTES[lesson.linked_tool] && (
        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">תרגול מעשי</p>
                <p className="text-xs text-muted-foreground">
                  אחרי השיעור הזה, נסה את {TOOL_LABELS[lesson.linked_tool]} כדי לתרגל את התוכן.
                </p>
              </div>
            </div>
            <Link to={TOOL_ROUTES[lesson.linked_tool]}>
              <Button size="sm" variant="outline">פתח</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end pt-2">
        <Button
          onClick={complete}
          disabled={completing || isCompleted}
          size="lg"
          className="gap-2"
        >
          {completing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {isCompleted ? 'הושלם' : 'סיימתי את השיעור'}
        </Button>
      </div>
    </div>
  );
}
