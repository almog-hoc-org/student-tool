import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Sparkles, Loader2, User as UserIcon, ExternalLink } from 'lucide-react';
import { sendRagMessage, type ChatTurn, type SourceRef } from '@/lib/chat';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logActivity } from '@/lib/activity';
import { useTrackToolUse } from '@/hooks/useActivityLog';

const SUGGESTIONS = [
  'מה אני יכול לקנות עם ההון שלי?',
  'איך אני מוזיל את המשכנתא?',
  'האם העסקה שחישבתי כדאית?',
  'מה זה יחס DTI ולמה זה חשוב?',
];

export default function Chat() {
  const { user, profile } = useAuth();
  useTrackToolUse('chat');
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!user || !text.trim() || loading) return;
    const userMsg: ChatTurn = { role: 'user', content: text.trim() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendRagMessage(text.trim(), threadId);
      setThreadId(res.threadId);
      setMessages(m => [...m, { role: 'assistant', content: res.reply, sources: res.sources }]);
      logActivity({ userId: user.id, type: 'chat_message' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה בשליחת ההודעה');
      setMessages(m => m.slice(0, -1));
      setInput(text.trim());
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-240px)] md:h-[calc(100vh-260px)]" dir="rtl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">צ׳אט הקורס</h1>
        </div>
        <Badge variant="outline" className="text-xs">תשובות מבוססות על תוכן הקורס</Badge>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-3">
        {messages.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">שלום {profile?.display_name || 'לך'}!</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                שאל אותי כל שאלה על תוכן הקורס — אני עונה רק על בסיס החומרים שלמדנו.
                לכל תשובה אצרף את השיעור המקור.
              </p>
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <p className="text-xs text-muted-foreground">הצעות לשאלות:</p>
              {SUGGESTIONS.map(s => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  className="w-full text-right justify-start"
                  onClick={() => send(s)}
                  disabled={loading}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={cn('flex gap-2', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
              )}>
                {m.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div className="space-y-2 max-w-[85%]">
                <div className={cn('rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap',
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
                )}>
                  {m.content}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <Sources sources={m.sources} />
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="rounded-2xl px-3 py-2 bg-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="שאל אותי כל דבר על הקורס..."
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
      <p className="text-xs text-muted-foreground text-center mt-2">
        * המידע להעשרה בלבד ואינו מהווה ייעוץ פיננסי מקצועי.
      </p>
    </div>
  );
}

interface SourcesProps { sources: SourceRef[] }
function Sources({ sources }: SourcesProps) {
  const unique = Array.from(new Map(sources.map(s => [s.lesson_slug, s])).values());
  return (
    <Card className="bg-muted/30">
      <CardContent className="p-2 space-y-1">
        <p className="text-xs text-muted-foreground">מקורות:</p>
        {unique.map(s => (
          <Link
            key={s.lesson_slug}
            to={`/learn/${s.course_slug}/${s.module_slug}/${s.lesson_slug}`}
            className="flex items-center justify-between text-xs hover:underline"
          >
            <span>{s.lesson_title}</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
