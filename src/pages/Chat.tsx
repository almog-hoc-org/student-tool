import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Sparkles, Loader2, User as UserIcon, AlertCircle } from 'lucide-react';
import { sendChatMessage, isChatAvailable, type ChatMessage } from '@/lib/local-chat';
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const available = isChatAvailable();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', text: text.trim() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendChatMessage(messages, text.trim());
      setMessages(m => [...m, { role: 'model', text: reply }]);
      if (user) logActivity({ userId: user.id, type: 'chat_message' });
    } catch (err) {
      toast.error('שגיאה בשליחת ההודעה. נסה שוב.');
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

  if (!available) {
    return (
      <div dir="rtl" className="space-y-4">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">צ'אט AI לא זמין</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                כדי להפעיל את הצ'אט, צריך להגדיר מפתח Google Gemini API (חינם).
                צור מפתח ב-
                <a href="https://aistudio.google.com/apikey" target="_blank" className="underline text-primary">
                  aistudio.google.com/apikey
                </a>
                {' '}והוסף ל-.env:
              </p>
              <code className="block bg-muted p-2 rounded text-xs" dir="ltr">
                VITE_GEMINI_API_KEY=your_key_here
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-240px)] md:h-[calc(100vh-260px)]" dir="rtl">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">יועץ AI</h1>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-3">
        {messages.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">שלום {profile?.display_name || 'לך'}!</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                שאל אותי על רכישת דירה, משכנתא, תוכנית עסקית — ואענה לך על בסיס הנתונים האישיים שלך.
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
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                {m.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div className={cn('rounded-2xl px-3 py-2 max-w-[85%] text-sm whitespace-pre-wrap',
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                {m.text}
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

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="שאל אותי כל דבר..."
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
