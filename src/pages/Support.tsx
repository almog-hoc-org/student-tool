import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, LifeBuoy, Loader2, Send, MessageSquareWarning, Clock3 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createSupportRequest,
  getSupportRequests,
  type SupportIssueType,
  type SupportPriority,
  type SupportTool,
  type SupportRequest,
} from '@/lib/support';

const issueLabels: Record<SupportIssueType, string> = {
  bug: 'תקלה',
  data: 'בעיה בנתונים',
  feature: 'בקשת שיפור',
  billing: 'חיוב/תשלום',
  access: 'גישה/אישור',
  other: 'אחר',
};

const toolLabels: Record<SupportTool, string> = {
  budget: 'תקציב',
  business_plan: 'תוכנית עסקית',
  mortgage: 'משכנתא',
  advisor: 'AI Advisor',
  chat: 'צ׳אט',
  account: 'אזור אישי',
  admin: 'ממשק ניהול',
  other: 'אחר',
};

const priorityLabels: Record<SupportPriority, string> = {
  low: 'נמוכה',
  normal: 'רגילה',
  high: 'גבוהה',
};

const statusLabels: Record<SupportRequest['status'], string> = {
  open: 'פתוח',
  resolved: 'טופל',
};

const defaultTool: SupportTool = 'other';
const defaultIssueType: SupportIssueType = 'bug';
const defaultPriority: SupportPriority = 'normal';

export default function Support() {
  const { user, profile } = useAuth();
  const [issueType, setIssueType] = useState<SupportIssueType>(defaultIssueType);
  const [tool, setTool] = useState<SupportTool>(defaultTool);
  const [priority, setPriority] = useState<SupportPriority>(defaultPriority);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<SupportRequest[]>(() => getSupportRequests());

  const openCount = useMemo(() => requests.filter(request => request.status === 'open').length, [requests]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !subject.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const next = createSupportRequest({
        userId: user.id,
        displayName: profile.display_name || 'ללא שם',
        email: user.email || '',
        issueType,
        tool,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        contextPath: window.location.pathname,
      }, user.id);
      setRequests(next);
      setSubject('');
      setDescription('');
      setIssueType(defaultIssueType);
      setTool(defaultTool);
      setPriority(defaultPriority);
      toast.success('הבקשה נשלחה לצוות התמיכה');
    } catch (error) {
      console.error(error);
      toast.error('לא הצלחתי לשמור את הבקשה');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LifeBuoy className="w-5 h-5" />
            תמיכה
          </h1>
          <p className="text-sm text-muted-foreground mt-1">שלח פנייה עם סוג הבעיה, הכלי והקשר שימוש.</p>
        </div>
        <Link to="/account">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            חזרה
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquareWarning className="w-4 h-4" />
            פתיחת קריאת תמיכה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-2 text-sm">
                <span className="font-medium">סוג הפנייה</span>
                <select className="w-full rounded-md border bg-background px-3 py-2" value={issueType} onChange={e => setIssueType(e.target.value as SupportIssueType)}>
                  {Object.entries(issueLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium">כלי</span>
                <select className="w-full rounded-md border bg-background px-3 py-2" value={tool} onChange={e => setTool(e.target.value as SupportTool)}>
                  {Object.entries(toolLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium">דחיפות</span>
                <select className="w-full rounded-md border bg-background px-3 py-2" value={priority} onChange={e => setPriority(e.target.value as SupportPriority)}>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2 text-sm text-muted-foreground">
              <div className="rounded-lg border p-3">
                <p className="font-medium text-foreground">משתמש</p>
                <p>{profile?.display_name || 'ללא שם'} · {user?.email}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="font-medium text-foreground">הקשר</p>
                <p dir="ltr">{window.location.pathname}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="כותרת קצרה לבקשה" />
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="תאר מה קרה, מה ציפית שיקרה, ואילו נתונים רלוונטיים יש לצוות" rows={6} />
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">הפנייה נשמרת בענן ומוצגת למנהל בממשק התמיכה.</p>
              <Button type="submit" disabled={submitting || !subject.trim() || !description.trim()} className="gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                שליחה
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock3 className="w-4 h-4" />
            הפניות האחרונות שלי
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{requests.length} פניות</span>
            <span>{openCount} פתוחות</span>
          </div>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">עדיין לא נשלחו פניות.</p>
          ) : (
            <div className="space-y-2">
              {requests.slice().reverse().map(request => (
                <div key={request.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{statusLabels[request.status]}</Badge>
                    <Badge variant="secondary">{issueLabels[request.issueType]}</Badge>
                    <Badge variant="secondary">{toolLabels[request.tool]}</Badge>
                    <Badge variant="secondary">דחיפות {priorityLabels[request.priority]}</Badge>
                  </div>
                  <p className="font-medium">{request.subject}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
