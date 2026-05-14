import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowRight, Mail, Calendar, AlertTriangle, GraduationCap, Activity,
  LifeBuoy, Send, Loader2, ShieldCheck, BookOpen,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type ActivityRow = Database['public']['Tables']['student_activity']['Row'];
type TicketRow = Database['public']['Tables']['support_tickets']['Row'];

interface AdminUserDetailRow {
  user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
  last_active_at: string | null;
  at_risk_flag: boolean;
  at_risk_reason: string | null;
  roles: string[];
}

interface CourseProgressRow {
  course_id: string;
  course_title: string;
  total_lessons: number;
  completed_lessons: number;
  in_progress_lessons: number;
  last_activity: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'ממתין',
  approved: 'מאושר',
  rejected: 'נדחה',
};

function relativeLabel(iso: string | null): string {
  if (!iso) return 'אף פעם';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return 'היום';
  if (days === 1) return 'אתמול';
  if (days < 7) return `לפני ${days} ימים`;
  if (days < 30) return `לפני ${Math.floor(days / 7)} שבועות`;
  return `לפני ${Math.floor(days / 30)} חודשים`;
}

function activityLabel(type: string): string {
  switch (type) {
    case 'tool_used': return 'שימוש בכלי';
    case 'lesson_viewed': return 'צפייה בשיעור';
    case 'lesson_completed': return 'השלמת שיעור';
    case 'chat_message': return 'הודעת צ׳אט';
    case 'support_opened': return 'פתיחת פנייה';
    case 'support_replied': return 'תגובה לפנייה';
    case 'login': return 'התחברות';
    case 'enrollment': return 'הרשמה לקורס';
    default: return type;
  }
}

export default function AdminUserDetail() {
  const { userId } = useParams();
  const [user, setUser] = useState<AdminUserDetailRow | null>(null);
  const [progress, setProgress] = useState<CourseProgressRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushSubject, setPushSubject] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [pushing, setPushing] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    (async () => {
      try {
        // Use admin_list_users to pull this row (RLS-safe single row return)
        const { data: rows } = await supabase.rpc('admin_list_users');
        const row = (rows ?? []).find(r => r.user_id === userId);
        if (row) {
          setUser({
            user_id: row.user_id,
            email: row.email,
            display_name: row.display_name,
            avatar_url: row.avatar_url,
            status: row.status,
            created_at: row.created_at,
            last_active_at: row.last_active_at,
            at_risk_flag: row.at_risk_flag,
            at_risk_reason: row.at_risk_reason,
            roles: row.roles ?? [],
          });
        }

        const [{ data: prog }, { data: act }, { data: tk }] = await Promise.all([
          supabase.rpc('user_course_progress', { _user_id: userId }),
          supabase
            .from('student_activity')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('support_tickets')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20),
        ]);

        setProgress(prog ?? []);
        setActivity(act ?? []);
        setTickets(tk ?? []);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'שגיאה בטעינה');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const sendPush = async () => {
    if (!userId || !pushSubject.trim() || !pushBody.trim()) return;
    setPushing(true);
    try {
      const { error } = await supabase.rpc('admin_send_notification', {
        _user_id: userId,
        _title: pushSubject.trim(),
        _body: pushBody.trim(),
        _category: 'admin_push',
        _link: '/account',
      });
      if (error) throw error;
      toast.success('ההתראה נשלחה (in-app + אימייל ייכנס לתור)');
      setPushSubject('');
      setPushBody('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setPushing(false);
    }
  };

  const stats = useMemo(() => {
    if (!progress.length) return { total: 0, completed: 0 };
    return {
      total: progress.reduce((s, p) => s + p.total_lessons, 0),
      completed: progress.reduce((s, p) => s + p.completed_lessons, 0),
    };
  }, [progress]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground" dir="rtl">
        <Loader2 className="w-4 h-4 animate-spin" />
        טוען...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-3" dir="rtl">
        <Link to="/admin/users">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowRight className="w-4 h-4" />
            חזרה
          </Button>
        </Link>
        <p>תלמיד לא נמצא.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <Link to="/admin/users">
        <Button variant="ghost" size="sm" className="gap-1">
          <ArrowRight className="w-4 h-4" />
          כל התלמידים
        </Button>
      </Link>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-full" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold">{(user.display_name ?? user.email ?? '?')[0]?.toUpperCase()}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">{user.display_name || 'ללא שם'}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1" dir="ltr">
                <Mail className="w-3 h-3" />
                {user.email}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{STATUS_LABELS[user.status] ?? user.status}</Badge>
                {user.roles?.includes('admin') && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    מנהל
                  </Badge>
                )}
                {user.at_risk_flag && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    בסיכון
                  </Badge>
                )}
              </div>
              {user.at_risk_reason && (
                <p className="text-xs text-amber-600 mt-1">{user.at_risk_reason}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                נרשם
              </p>
              <p className="font-medium">{relativeLabel(user.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="w-3 h-3" />
                פעיל לאחרונה
              </p>
              <p className="font-medium">{relativeLabel(user.last_active_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                התקדמות
              </p>
              <p className="font-medium">{stats.completed} / {stats.total} שיעורים</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="w-4 h-4" />
            שלח דחיפה לתלמיד
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            שולח התראה בתוך האפליקציה ואימייל.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="כותרת"
            value={pushSubject}
            onChange={e => setPushSubject(e.target.value)}
          />
          <Textarea
            rows={4}
            placeholder="גוף ההודעה"
            value={pushBody}
            onChange={e => setPushBody(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              className="gap-2"
              onClick={sendPush}
              disabled={pushing || !pushSubject.trim() || !pushBody.trim()}
            >
              {pushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              שליחה
            </Button>
          </div>
        </CardContent>
      </Card>

      {progress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              התקדמות בקורסים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {progress.map(p => {
              const pct = p.total_lessons ? Math.round((p.completed_lessons / p.total_lessons) * 100) : 0;
              return (
                <div key={p.course_id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{p.course_title}</span>
                    <span className="text-muted-foreground">
                      {p.completed_lessons}/{p.total_lessons} · {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {tickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LifeBuoy className="w-4 h-4" />
              פניות תמיכה ({tickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tickets.map(t => (
              <Link to="/admin/support" key={t.id} className="block rounded-lg border p-3 hover:bg-muted/50 transition">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm">{t.subject}</p>
                  <Badge variant="secondary">{t.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(t.created_at).toLocaleString('he-IL')}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" />
            פעילות אחרונה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין פעילות.</p>
          ) : (
            activity.map(a => (
              <div key={a.id} className="flex items-center justify-between gap-3 py-1 text-sm border-b last:border-0">
                <span>
                  {activityLabel(a.activity_type)}
                  {a.resource_id && <span className="text-muted-foreground"> · {a.resource_id}</span>}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(a.created_at).toLocaleString('he-IL')}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
