import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageCircle,
  Send,
  Sparkles,
  Loader2,
  User as UserIcon,
  AlertCircle,
  BookOpen,
  Clock,
} from 'lucide-react';
import {
  loadMessages,
  sendAiMessage,
  getOrCreateLatestConversation,
  getConversation,
  type ChatDbMessage,
  type ConversationRow,
} from '@/lib/chat-api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ExpertContactCard } from '@/components/ExpertContactCard';

const SUGGESTIONS = [
  'מה אני יכול לקנות עם ההון שלי?',
  'איך אני מוזיל את המשכנתא?',
  'האם העסקה שחישבתי כדאית?',
  'מה זה יחס DTI ולמה זה חשוב?',
];

export default function Chat() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const explicitConversationId = searchParams.get('conversation');
  const [conversation, setConversation] = useState<ConversationRow | null>(null);
  const [messages, setMessages] = useState<ChatDbMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Init: load explicit conversation (deep-link from notification) or latest
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const conv = explicitConversationId
          ? await getConversation(explicitConversationId)
          : await getOrCreateLatestConversation();
        if (cancelled) return;
        if (!conv) {
          setInitError('שיחה לא נמצאה');
          return;
        }
        setConversation(conv);
        const msgs = await loadMessages(conv.id);
        if (cancelled) return;
        setMessages(msgs);
      } catch (e) {
        console.error(e);
        setInitError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [explicitConversationId]);

  // Jump instantly on initial mount (avoid the visible "scroll from top to bottom"
  // animation when opening an existing conversation with many messages), then
  // smooth-scroll for subsequent new messages.
  const initialScrollDone = useRef(false);
  useEffect(() => {
    if (!scrollRef.current || messages.length === 0) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: initialScrollDone.current ? 'smooth' : 'auto',
    });
    initialScrollDone.current = true;
  }, [messages, loading]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading || !conversation) return;
      const optimistic: ChatDbMessage = {
        id: `tmp-${Date.now()}`,
        conversation_id: conversation.id,
        role: 'user',
        content: text.trim(),
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, optimistic]);
      setInput('');
      setLoading(true);
      try {
        const res = await sendAiMessage(text.trim(), conversation.id);
        const fresh = await loadMessages(conversation.id);
        setMessages(fresh);
        if (res.conversation_id !== conversation.id) {
          setConversation((c) => (c ? { ...c, id: res.conversation_id } : c));
        }
      } catch (err) {
        toast.error('שגיאה בשליחה. נסה שוב.');
        console.error(err);
        setMessages((m) => m.filter((x) => x.id !== optimistic.id));
        setInput(text.trim());
      } finally {
        setLoading(false);
      }
    },
    [conversation, loading],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  if (initError) {
    return (
      <div dir="rtl" className="space-y-4">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="w-7 h-7 text-amber-500 mx-auto" />
            <h3 className="font-semibold">לא הצלחנו לטעון את הצ׳אט</h3>
            <p className="text-sm text-muted-foreground">{initError}</p>
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                נסה שוב
              </Button>
              <Button size="sm" onClick={() => { window.location.href = '/chat'; }}>
                פתח שיחה חדשה
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const awaitingHuman = conversation?.status === 'awaiting_human';

  return (
    <div
      className="flex flex-col h-[calc(100vh-240px)] md:h-[calc(100vh-260px)]"
      dir="rtl"
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">יועץ AI</h1>
        {awaitingHuman && (
          <span className="inline-flex items-center gap-1 text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" /> ממתין לנציג
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-3">
        {messages.length === 0 && !loading ? (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">
                שלום {profile?.display_name || 'לך'}!
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                שאל אותי על רכישת דירה, משכנתא, תוכנית עסקית — אענה לך על בסיס
                הנתונים שלך והחומרים בקורס. אם תרצה מענה אנושי על שאלה
                ספציפית — תוכל לשלוח אותה לנציג מהבאנר שבתחתית הדף.
              </p>
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <p className="text-xs text-muted-foreground">הצעות לשאלות:</p>
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  className="w-full text-right justify-start"
                  onClick={() => send(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
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

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="שאל אותי כל דבר..."
          disabled={loading || !conversation}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim() || !conversation}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
      <p className="text-xs text-muted-foreground text-center mt-2">
        * המידע להעשרה בלבד ואינו מהווה ייעוץ פיננסי מקצועי.
      </p>

      {/* Inviting banner — AI is the primary path; human is a clearly-marked safety net */}
      <div className="mt-3">
        <ExpertContactCard variant="subtle" />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatDbMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isHuman = message.role === 'human';

  if (isSystem) {
    return (
      <div className="text-center">
        <span className="inline-block text-xs text-muted-foreground bg-muted/60 rounded-full px-3 py-1">
          {message.content}
        </span>
      </div>
    );
  }

  const sources = ((message.metadata as { sources?: { source_file: string }[] } | null)?.sources ?? []);

  return (
    <div className={cn('flex gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          isUser
            ? 'bg-primary text-primary-foreground'
            : isHuman
              ? 'bg-emerald-500 text-white'
              : 'bg-muted',
        )}
      >
        {isUser ? (
          <UserIcon className="w-4 h-4" />
        ) : isHuman ? (
          <LifeBuoy className="w-4 h-4" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
      </div>
      <div className="max-w-[85%] space-y-1">
        <div
          className={cn(
            'rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap',
            isUser
              ? 'bg-primary text-primary-foreground'
              : isHuman
                ? 'bg-emerald-500/10 text-foreground border border-emerald-500/20'
                : 'bg-muted',
          )}
        >
          {message.content}
        </div>
        {sources.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <BookOpen className="w-3 h-3" />
            <span>
              מבוסס על: {sources.map((s) => s.source_file).join(', ')}
            </span>
          </div>
        )}
        {isHuman && (
          <div className="text-xs text-emerald-600">תשובה מנציג אנושי</div>
        )}
      </div>
    </div>
  );
}
