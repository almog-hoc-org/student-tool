import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Inbox,
  Clock,
  CheckCircle2,
  Send,
  Loader2,
  MessageCircle,
  Sparkles,
  User as UserIcon,
  LifeBuoy,
  Pin,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Status = 'awaiting_human' | 'open' | 'resolved';

interface ConversationItem {
  id: string;
  user_id: string;
  user_email: string;
  user_display_name: string | null;
  title: string | null;
  status: Status;
  priority: number;
  last_message_at: string;
  message_count: number;
  last_message_preview: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'ai' | 'human' | 'system';
  content: string;
  created_at: string;
  metadata?: { event?: string; origin?: string } | null;
}

/**
 * Find the specific question the student wants answered.
 * - If there's an escalation marker (system message with metadata.event='escalation'),
 *   the question is the most recent user message BEFORE that marker.
 * - Otherwise, the first user message in the conversation.
 */
function findStudentQuestion(messages: Message[]): Message | null {
  let escalationAt = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'system' && messages[i].metadata?.event === 'escalation') {
      escalationAt = i;
      break;
    }
  }
  if (escalationAt > 0) {
    for (let i = escalationAt - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i];
    }
  }
  return messages.find((m) => m.role === 'user') ?? null;
}

export default function AdminInbox() {
  const [tab, setTab] = useState<Status>('awaiting_human');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_list_conversations', {
      _status: tab,
      _limit: 100,
    });
    if (error) {
      toast.error('שגיאה בטעינת רשימה');
      console.error(error);
    } else {
      setConversations((data as ConversationItem[]) || []);
    }
    setLoading(false);
  }, [tab]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('id, role, content, created_at, metadata')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    setMessages((data || []) as Message[]);
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (selectedId) fetchMessages(selectedId);
  }, [selectedId, fetchMessages]);

  // Realtime: new messages on selected conversation + refresh list
  useEffect(() => {
    const channel = supabase
      .channel(`inbox-admin`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as Message & { conversation_id: string };
          if (m.conversation_id === selectedId) {
            setMessages((curr) => [...curr, m]);
          }
          fetchList();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        () => fetchList(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId, fetchList]);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId],
  );

  const send = async (resolve: boolean) => {
    if (!selectedId || !reply.trim() || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.rpc('admin_reply', {
        _conversation_id: selectedId,
        _content: reply.trim(),
        _resolve: resolve,
      });
      if (error) throw error;
      toast.success(resolve ? 'נשלח וסומן כסגור' : 'נשלח');
      setReply('');
      await fetchMessages(selectedId);
      await fetchList();
    } catch (e) {
      toast.error('שגיאה בשליחה');
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Inbox className="w-6 h-6" /> תיבת פניות
        </h1>
        <Link to="/admin">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" /> חזרה
          </Button>
        </Link>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList>
          <TabsTrigger value="awaiting_human">
            <Clock className="w-3 h-3 ml-1" /> ממתינות לתגובה
          </TabsTrigger>
          <TabsTrigger value="open">פתוחות</TabsTrigger>
          <TabsTrigger value="resolved">
            <CheckCircle2 className="w-3 h-3 ml-1" /> סגורות
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid md:grid-cols-3 gap-4">
        {/* List */}
        <div className="md:col-span-1 space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground p-4">טוען...</p>
          ) : conversations.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                אין פניות בקטגוריה הזו
              </CardContent>
            </Card>
          ) : (
            conversations.map((c) => (
              <Card
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  'cursor-pointer hover:border-primary/50 transition-colors',
                  c.id === selectedId && 'border-primary',
                )}
              >
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate">
                      {c.user_display_name || c.user_email}
                    </p>
                    <Badge
                      variant="secondary"
                      className={
                        c.status === 'awaiting_human'
                          ? 'bg-amber-100 text-amber-800'
                          : c.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ''
                      }
                    >
                      {c.status === 'awaiting_human'
                        ? 'ממתין'
                        : c.status === 'resolved'
                          ? 'סגור'
                          : 'פתוח'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {c.last_message_preview || c.title || 'אין הודעות'}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{c.message_count} הודעות</span>
                    <span>
                      {new Date(c.last_message_at).toLocaleString('he-IL')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="md:col-span-2">
          {!selected ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                בחר פנייה מהרשימה כדי לראות ולענות
              </CardContent>
            </Card>
          ) : (
            <Card className="flex flex-col h-[calc(100vh-260px)]">
              <CardContent className="p-3 border-b">
                <p className="font-semibold text-sm">
                  {selected.user_display_name || selected.user_email}
                </p>
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {selected.user_email}
                </p>
              </CardContent>
              {(() => {
                const question = findStudentQuestion(messages);
                if (!question) return null;
                return (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5">
                      <Pin className="w-3.5 h-3.5" />
                      השאלה שהתלמיד שואל
                    </div>
                    <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed text-foreground">
                      {question.content}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      נשלחה ב-{new Date(question.created_at).toLocaleString('he-IL')}
                    </p>
                  </div>
                );
              })()}
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 px-1">
                    התכתבות מלאה (כולל הצ׳אט עם ה-AI)
                  </p>
                  {messages.map((m) => (
                    <InboxMessage key={m.id} message={m} />
                  ))}
                </div>
              </ScrollArea>
              <div className="border-t p-3 space-y-2">
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="כתוב תשובה לתלמיד..."
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => send(false)}
                    disabled={sending || !reply.trim()}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 ml-1" />
                    )}
                    שלח
                  </Button>
                  <Button
                    onClick={() => send(true)}
                    disabled={sending || !reply.trim()}
                  >
                    <CheckCircle2 className="w-4 h-4 ml-1" />
                    שלח וסגור
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function InboxMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const isAi = message.role === 'ai';
  const isHuman = message.role === 'human';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="text-center my-1">
        <span className="text-[10px] text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2', isUser ? 'flex-row' : 'flex-row-reverse')}>
      <div
        className={cn(
          'w-7 h-7 rounded-full shrink-0 flex items-center justify-center',
          isUser
            ? 'bg-muted'
            : isAi
              ? 'bg-primary/10 text-primary'
              : 'bg-emerald-500 text-white',
        )}
      >
        {isUser ? (
          <UserIcon className="w-3.5 h-3.5" />
        ) : isAi ? (
          <Sparkles className="w-3.5 h-3.5" />
        ) : (
          <LifeBuoy className="w-3.5 h-3.5" />
        )}
      </div>
      <div
        className={cn(
          'rounded-2xl px-3 py-2 text-sm max-w-[80%] whitespace-pre-wrap',
          isUser
            ? 'bg-muted'
            : isAi
              ? 'bg-primary/5'
              : 'bg-emerald-500/10 border border-emerald-500/20',
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
