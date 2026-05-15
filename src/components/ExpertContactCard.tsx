import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Headphones, Loader2, Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Persistent "ask a human expert" entry point.
 *
 * variant="card" (default) — gradient card, prominent. For /account.
 * variant="subtle" — single-line muted link. For /chat (below input), so
 *   the student tries the AI first and treats the human as a safety net.
 *
 * Both variants open the same submission dialog.
 */
export function ExpertContactCard({ variant = 'card' }: { variant?: 'card' | 'subtle' } = {}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      const { data, error } = await supabase.rpc('ask_human_expert', {
        _subject: subject.trim() || null,
        _body: body.trim(),
      });
      if (error) throw error;
      toast.success('הפנייה נשלחה לנציג. נחזור אליך בהקדם.', {
        description: 'תקבל התראה כשהמענה יגיע.',
      });
      setOpen(false);
      setSubject('');
      setBody('');
      // Optionally jump the student straight into the new conversation
      if (data) navigate(`/chat?conversation=${data}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה בשליחה');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {variant === 'subtle' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition py-1"
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>
            לא מצאת תשובה? <span className="underline underline-offset-2">פנה למומחה קרנף אנושי</span>
          </span>
        </button>
      ) : (
        <Card className="border-primary/30 bg-gradient-to-l from-primary/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">לא מצאת תשובה לשאלה שחיפשת?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                כתוב למומחה קרנף אנושי ונענה לך בהקדם.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setOpen(true)}
              className="gap-1 shrink-0"
            >
              <Send className="w-4 h-4" />
              פנייה
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-primary" />
              פנייה למומחה קרנף
            </DialogTitle>
            <DialogDescription>
              הפנייה נשלחת לצוות התמיכה. נחזור אליך בתוך 24 שעות ותקבל
              התראה ברגע שהמענה יהיה זמין באזור האישי.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">נושא (אופציונלי)</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="לדוגמה: התלבטות בין שתי דירות"
                maxLength={120}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">השאלה שלך</label>
              <Textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="פרט את השאלה או ההתלבטות. ככל שתיתן יותר רקע — נוכל לתת לך תשובה איכותית יותר."
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={sending}
            >
              <ArrowLeft className="w-4 h-4 ml-1" />
              ביטול
            </Button>
            <Button
              onClick={submit}
              disabled={sending || !body.trim()}
              className="gap-1"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              שלח לנציג
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
