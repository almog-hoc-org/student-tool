import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, LifeBuoy, Search, MessageCircle, UserPlus, Loader2, Send, History as HistoryIcon, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  listAdminQueue,
  listMessages,
  postAdminMessage,
  assignTicket,
  updateTicketStatus,
  listTicketHistory,
  issueLabels,
  toolLabels,
  priorityLabels,
  statusLabels,
  type SupportIssueType,
  type SupportTool,
  type SupportStatus,
  type SupportTicketAdminView,
  type SupportTicketMessage,
  type SupportTicketHistory,
} from '@/lib/support';

type Filter = 'all' | 'mine' | 'open' | 'urgent';

export default function AdminSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicketAdminView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('open');
  const [active, setActive] = useState<SupportTicketAdminView | null>(null);

  async function reload() {
    setLoading(true);
    try {
      setTickets(await listAdminQueue());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בטעינה');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return tickets.filter(t => {
      if (filter === 'mine' && t.assigned_admin_id !== user?.id) return false;
      if (filter === 'open' && (t.status === 'resolved' || t.status === 'closed')) return false;
      if (filter === 'urgent' && t.priority !== 'urgent' && t.priority !== 'high') return false;
      if (!query) return true;
      const hay = [t.subject, t.description, t.issue_type, t.tool, t.user_email, t.user_display_name].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(query);
    });
  }, [tickets, search, filter, user?.id]);

  if (active) {
    return (
      <AdminTicketDetail
        ticket={active}
        onBack={() => { setActive(null); reload(); }}
        onTicketChanged={() => reload()}
      />
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LifeBuoy className="w-5 h-5" />
            תמיכה
          </h1>
          <p className="text-sm text-muted-foreground mt-1">פניות שנשלחו על ידי תלמידים. לחץ על פנייה לפתיחת השיחה.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="gap-1" onClick={reload}>
            <RefreshCcw className="w-4 h-4" />
            רענן
          </Button>
          <Link to="/admin">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              חזרה
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={filter === 'open'} onClick={() => setFilter('open')}>
          פתוחות
        </FilterChip>
        <FilterChip active={filter === 'mine'} onClick={() => setFilter('mine')}>
          שלי
        </FilterChip>
        <FilterChip active={filter === 'urgent'} onClick={() => setFilter('urgent')}>
          דחופות
        </FilterChip>
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          הכל
        </FilterChip>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className="w-full rounded-md border bg-background px-3 py-2 pr-10"
          placeholder="חיפוש לפי משתמש, כלי או נושא..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">תור פניות ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">טוען...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין פניות להצגה.</p>
          ) : (
            filtered.map(ticket => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setActive(ticket)}
                className="w-full text-right rounded-lg border p-4 space-y-2 hover:bg-muted/50 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {ticket.user_display_name || 'תלמיד'} · {ticket.user_email}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={ticket.priority === 'urgent' ? 'destructive' : 'secondary'}>
                      {priorityLabels[ticket.priority]}
                    </Badge>
                    <Badge variant="secondary">{statusLabels[ticket.status]}</Badge>
                    <Badge variant="secondary">{issueLabels[ticket.issue_type as SupportIssueType] ?? ticket.issue_type}</Badge>
                    {ticket.tool && <Badge variant="secondary">{toolLabels[ticket.tool as SupportTool] ?? ticket.tool}</Badge>}
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap line-clamp-2">{ticket.description}</p>
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {ticket.message_count} הודעות
                  </span>
                  <span>{new Date(ticket.created_at).toLocaleString('he-IL')}</span>
                  {ticket.assigned_admin_display_name && (
                    <span>משויך: {ticket.assigned_admin_display_name}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}
function FilterChip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm transition ${active ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
    >
      {children}
    </button>
  );
}

interface DetailProps {
  ticket: SupportTicketAdminView;
  onBack: () => void;
  onTicketChanged: () => void;
}

function AdminTicketDetail({ ticket, onBack, onTicketChanged }: DetailProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [history, setHistory] = useState<SupportTicketHistory[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [msgs, hist] = await Promise.all([
        listMessages(ticket.id),
        listTicketHistory(ticket.id),
      ]);
      setMessages(msgs);
      setHistory(hist);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בטעינת השיחה');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [ticket.id]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reply.trim()) return;
    setSending(true);
    try {
      const msg = await postAdminMessage(ticket.id, user.id, reply.trim());
      setMessages(prev => [...prev, msg]);
      setReply('');
      // After admin reply, ticket usually goes back to awaiting_user
      if (ticket.status === 'open' || ticket.status === 'in_progress') {
        await updateTicketStatus(ticket.id, 'awaiting_user');
        onTicketChanged();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בשליחה');
    } finally {
      setSending(false);
    }
  };

  const assignToMe = async () => {
    if (!user) return;
    setActing(true);
    try {
      await assignTicket(ticket.id, user.id);
      toast.success('הפנייה שויכה אליך');
      onTicketChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בשיוך');
    } finally {
      setActing(false);
    }
  };

  const setStatus = async (status: SupportStatus) => {
    setActing(true);
    try {
      await updateTicketStatus(ticket.id, status);
      toast.success(`הסטטוס עודכן ל-${statusLabels[status]}`);
      onTicketChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'שגיאה בעדכון');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div>
        <Button variant="ghost" size="sm" className="gap-1 mb-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          חזרה לתור
        </Button>
        <h1 className="text-2xl font-bold">{ticket.subject}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {ticket.user_display_name || 'תלמיד'} · {ticket.user_email}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant={ticket.priority === 'urgent' ? 'destructive' : 'secondary'}>
            {priorityLabels[ticket.priority]}
          </Badge>
          <Badge variant="secondary">{statusLabels[ticket.status]}</Badge>
          <Badge variant="secondary">{issueLabels[ticket.issue_type as SupportIssueType] ?? ticket.issue_type}</Badge>
          {ticket.tool && <Badge variant="secondary">{toolLabels[ticket.tool as SupportTool] ?? ticket.tool}</Badge>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">פעולות</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {ticket.assigned_admin_id !== user?.id && (
            <Button size="sm" variant="outline" className="gap-1" disabled={acting} onClick={assignToMe}>
              <UserPlus className="w-4 h-4" />
              שייך אליי
            </Button>
          )}
          {ticket.status !== 'in_progress' && (
            <Button size="sm" variant="outline" disabled={acting} onClick={() => setStatus('in_progress')}>
              סמן כבטיפול
            </Button>
          )}
          {ticket.status !== 'awaiting_user' && (
            <Button size="sm" variant="outline" disabled={acting} onClick={() => setStatus('awaiting_user')}>
              ממתין למשתמש
            </Button>
          )}
          {ticket.status !== 'resolved' && (
            <Button size="sm" variant="outline" disabled={acting} onClick={() => setStatus('resolved')}>
              סמן כפתור
            </Button>
          )}
          {ticket.status !== 'closed' && (
            <Button size="sm" variant="outline" disabled={acting} onClick={() => setStatus('closed')}>
              סגור פנייה
            </Button>
          )}
        </CardContent>
      </Card>

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
            <p className="text-sm text-muted-foreground">אין הודעות עדיין. השב לפנייה למטה.</p>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`rounded-lg border p-3 ${msg.author_role === 'admin' ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}`}
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span className="font-medium">{msg.author_role === 'admin' ? 'צוות' : ticket.user_display_name || 'תלמיד'}</span>
                  <span>{new Date(msg.created_at).toLocaleString('he-IL')}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
              </div>
            ))
          )}

          {ticket.status !== 'closed' && (
            <form onSubmit={sendReply} className="space-y-2 pt-3 border-t">
              <Textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="כתוב תגובה לתלמיד..."
                rows={4}
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={sending || !reply.trim()} className="gap-2">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  שלח תגובה
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HistoryIcon className="w-4 h-4" />
              היסטוריה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {history.map(h => (
              <div key={h.id} className="text-muted-foreground">
                <span dir="ltr">{new Date(h.created_at).toLocaleString('he-IL')}</span>
                {' — '}
                <span>שינוי ב-{h.field}: {h.old_value ?? '∅'} → {h.new_value ?? '∅'}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
