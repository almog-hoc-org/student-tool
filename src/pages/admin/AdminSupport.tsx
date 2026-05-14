import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, LifeBuoy, Search, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SupportRequest } from '@/lib/support';

interface SupportTicketRow {
  user_id: string;
  data: SupportRequest[] | null;
}

interface UserRow {
  user_id: string;
  email: string;
  display_name: string | null;
}

const issueLabels = {
  bug: 'תקלה',
  data: 'בעיה בנתונים',
  feature: 'בקשת שיפור',
  billing: 'חיוב/תשלום',
  access: 'גישה/אישור',
  other: 'אחר',
} as const;

const toolLabels = {
  budget: 'תקציב',
  business_plan: 'תוכנית עסקית',
  mortgage: 'משכנתא',
  advisor: 'AI Advisor',
  chat: 'צ׳אט',
  account: 'אזור אישי',
  admin: 'ממשק ניהול',
  other: 'אחר',
} as const;

const priorityLabels = {
  low: 'נמוכה',
  normal: 'רגילה',
  high: 'גבוהה',
} as const;

const statusLabels = {
  open: 'פתוח',
  resolved: 'טופל',
} as const;

export default function AdminSupport() {
  const [tickets, setTickets] = useState<SupportRequest[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [usersRes, ticketsRes] = await Promise.all([
      supabase.rpc('admin_list_users'),
      supabase.from('user_data').select('user_id, data').eq('tool_key', 'support_requests'),
    ]);

    if (usersRes.error) {
      toast.error('שגיאה בטעינת משתמשים');
      console.error(usersRes.error);
    } else {
      setUsers(usersRes.data ?? []);
    }

    if (ticketsRes.error) {
      toast.error('שגיאה בטעינת פניות');
      console.error(ticketsRes.error);
    } else {
      const flattened = (ticketsRes.data as SupportTicketRow[] | null ?? []).flatMap(row => Array.isArray(row.data) ? row.data : []);
      setTickets(flattened.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    }

    setLoading(false);
  }

  const userMap = useMemo(() => new Map(users.map(user => [user.user_id, user])), [users]);

  const filtered = tickets.filter(ticket => {
    const user = userMap.get(ticket.userId);
    const haystack = [ticket.subject, ticket.description, ticket.tool, ticket.issueType, ticket.status, user?.email, user?.display_name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  async function markResolved(ticketId: string) {
    const updatedAt = new Date().toISOString();
    const next = tickets.map(ticket => (
      ticket.id === ticketId ? { ...ticket, status: 'resolved' as const, updatedAt } : ticket
    ));
    setTickets(next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));

    const ticket = next.find(item => item.id === ticketId);
    if (!ticket) return;

    const payload = next.filter(item => item.userId === ticket.userId);
    const { error } = await supabase.from('user_data').upsert({
      user_id: ticket.userId,
      tool_key: 'support_requests',
      data: payload,
      updated_at: updatedAt,
    }, { onConflict: 'user_id,tool_key' });
    if (error) {
      toast.error('שגיאה בעדכון הפנייה');
      console.error(error);
    } else {
      toast.success('הפנייה סומנה כטופלה');
      loadData();
    }
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LifeBuoy className="w-5 h-5" />
            תמיכה
          </h1>
          <p className="text-sm text-muted-foreground mt-1">קריאות שנשלחו מהאזור האישי של המשתמשים.</p>
        </div>
        <Link to="/admin">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            חזרה
          </Button>
        </Link>
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
          <CardTitle className="text-base">תור פניות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">טוען...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין פניות להצגה.</p>
          ) : (
            filtered.map(ticket => {
              const user = userMap.get(ticket.userId);
              return (
                <div key={ticket.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="text-sm text-muted-foreground">{user?.display_name || ticket.displayName} · {user?.email || ticket.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{statusLabels[ticket.status]}</Badge>
                      <Badge variant="secondary">{issueLabels[ticket.issueType]}</Badge>
                      <Badge variant="secondary">{toolLabels[ticket.tool]}</Badge>
                      <Badge variant="secondary">{priorityLabels[ticket.priority]}</Badge>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>נוצר: {new Date(ticket.createdAt).toLocaleString('he-IL')}</span>
                    <span dir="ltr">{ticket.contextPath}</span>
                    {ticket.status === 'open' ? (
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => markResolved(ticket.id)}>
                        <CheckCircle2 className="w-4 h-4" />
                        סמן כטופל
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
