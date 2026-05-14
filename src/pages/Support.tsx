import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, LifeBuoy, Loader2, Send, MessageSquareWarning, Clock3, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  createTicket,
  listMyTickets,
  listMessages,
  postStudentMessage,
  issueLabels,
  toolLabels,
  priorityLabels,
  statusLabels,
  openStatuses,
  type SupportIssueType,
  type SupportPriority,
  type SupportTool,
  type SupportTicket,
  type SupportTicketMessage,
} from '@/lib/support';

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
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);

  const openCount = useMemo(
    () => tickets.filter(t => openStatuses.includes(t.status)).length,
    [tickets],
  );

  useEffect(() => {
    if (!user) return;
    setLoadingTickets(true);
    listMyTickets(user.id)
      .then(setTickets)
      .catch(() => toast.error('לא הצלחתי לטעון פניות'))
      .finally(() => setLoadingTickets(false));
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !subject.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const created = await createTicket(user.id, {
        subject: subject.trim(),
        description: description.trim(),
        issueType,
        tool,
        priority,
        contextPath: window.location.pathname,
      });
      setTickets(prev => [created, ...prev]);
      setSubject('');
      setDescription('');
      setIssueType(defaultIssueType);
      setTool(defaultTool);
      setPriority(defaultPriority);
      toast.success('הפנייה נשלחה לצוות התמיכה');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'לא הצלחתי לשמור את הפנייה');
    } finally {
      setSubmitting(false);
    }
  };

  if (activeTicket) {
    return (
      <TicketThread
        ticket={activeTicket}
        onBack={() => setActiveTicket(null)}
        onTicketChange={updated => {
          setTickets(prev => prev.map(t => (t.id === updated.id ? updated : t)));
          setActiveTicket(updated);
        }}
      />
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LifeBuoy className="w-5 h-5" />
            תמיכה
          </h1>
          <p className="text-sm text-muted-foreground mt-1">שלח פנייה לנציג תמיכה. נציב יחזרו אליך כאן בהודעה.</p>
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
            פתיחת פנייה חדשה
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
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="כותרת קצרה לפנייה" />
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="תאר מה קרה, מה ציפית שיקרה, ואילו נתונים רלוונטיים יש לצוות" rows={6} />
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">הפנייה נשמרת בענן ונציג יחזור אליך כאן ב-thread.</p>
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
            הפניות שלי
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{tickets.length} פניות</span>
            <span>{openCount} פתוחות</span>
          </div>
          {loadingTickets ? (
            <p className="text-sm text-muted-foreground">טוען...</p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">עדיין לא נשלחו פניות.</p>
          ) : (
            <div className="space-y-2">
              {tickets.map(ticket => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setActiveTicket(ticket)}
                  className="w-full text-right rounded-lg border p-3 space-y-2 hover:bg-muted/50 transition"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{statusLabels[ticket.status]}</Badge>
                    <Badge variant="secondary">{issueLabels[ticket.issue_type as SupportIssueType] ?? ticket.issue_type}</Badge>
                    {ticket.tool && <Badge variant="secondary">{toolLabels[ticket.tool as SupportTool] ?? ticket.tool}</Badge>}
                    <Badge variant="secondary">דחיפות {priorityLabels[ticket.priority]}</Badge>
                  </div>
                  <p className="font-medium">{ticket.subject}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-2">{ticket.description}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    פתח שיחה
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface TicketThreadProps {
  ticket: SupportTicket;
  onBack: () => void;
  onTicketChange: (ticket: SupportTicket) => void;
}

function TicketThread({ ticket, onBack, onTicketChange }: TicketThreadProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listMessages(ticket.id)
      .then(setMessages)
      .catch(() => toast.error('שגיאה בטעינת השיחה'))
      .finally(() => setLoading(false));
  }, [ticket.id]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reply.trim()) return;
    setSending(true);
    try {
      const msg = await postStudentMessage(ticket.id, user.id, reply.trim());
      setMessages(prev => [...prev, msg]);
      setReply('');
      onTicketChange({ ...ticket, updated_at: new Date().toISOString() });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'לא הצלחתי לשלוח הודעה');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" className="gap-1 mb-2" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            חזרה לרשימה
          </Button>
          <h1 className="text-2xl font-bold">{ticket.subject}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="secondary">{statusLabels[ticket.status]}</Badge>
            <Badge variant="secondary">דחיפות {priorityLabels[ticket.priority]}</Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">הפנייה המקורית</CardTitle>
        </CardHeader>
        <CardContent className="text-sm whitespace-pre-wrap">{ticket.description}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            השיחה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">טוען הודעות...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">עדיין אין תגובה מצוות התמיכה. נחזור אליך בקרוב.</p>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`rounded-lg border p-3 ${msg.author_role === 'admin' ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}`}
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span className="font-medium">{msg.author_role === 'admin' ? 'צוות תמיכה' : 'אתה'}</span>
                  <span>{new Date(msg.created_at).toLocaleString('he-IL')}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
              </div>
            ))
          )}

          {ticket.status !== 'closed' && (
            <form onSubmit={send} className="space-y-2 pt-3 border-t">
              <Textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="הקלד תגובה..."
                rows={3}
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={sending || !reply.trim()} className="gap-2">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  שליחה
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
