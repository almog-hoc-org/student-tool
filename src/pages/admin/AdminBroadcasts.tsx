import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Megaphone, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BroadcastRow {
  id: string;
  title: string;
  body: string;
  total_recipients: number;
  sent_at: string;
  target_filter: Record<string, unknown>;
}

export default function AdminBroadcasts() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [status, setStatus] = useState<string>('approved');
  const [inactiveDays, setInactiveDays] = useState<string>('');
  const [preview, setPreview] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<BroadcastRow[]>([]);

  const buildFilter = useCallback(() => {
    const f: Record<string, unknown> = {};
    if (status && status !== 'all') f.status = status;
    if (inactiveDays.trim()) {
      const n = Number(inactiveDays);
      if (!Number.isNaN(n) && n > 0) f.inactive_days_gte = String(n);
    }
    return f;
  }, [status, inactiveDays]);

  const previewCount = useCallback(async () => {
    setPreviewing(true);
    const { data, error } = await supabase.rpc('admin_broadcast_preview_count', {
      _target_filter: buildFilter(),
    });
    if (error) {
      toast.error('שגיאה בחישוב נמענים');
      console.error(error);
    } else {
      setPreview((data as number) ?? 0);
    }
    setPreviewing(false);
  }, [buildFilter]);

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from('broadcasts')
      .select('id, title, body, total_recipients, sent_at, target_filter')
      .order('sent_at', { ascending: false })
      .limit(20);
    setHistory((data as BroadcastRow[]) || []);
  }, []);

  useEffect(() => {
    loadHistory();
    previewCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    previewCount();
  }, [previewCount]);

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('כותרת וגוף חייבים להיות מלאים');
      return;
    }
    if (!window.confirm(`לשלוח לכ-${preview ?? '?'} משתמשים?`)) return;
    setSending(true);
    try {
      const { error } = await supabase.rpc('admin_send_broadcast', {
        _title: title.trim(),
        _body: body.trim(),
        _link: link.trim() || null,
        _target_filter: buildFilter(),
      });
      if (error) throw error;
      toast.success('נשלח בהצלחה');
      setTitle('');
      setBody('');
      setLink('');
      loadHistory();
    } catch (e) {
      toast.error('שגיאה בשליחה');
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="w-6 h-6" /> הודעות תפוצה
        </h1>
        <Link to="/admin">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" /> חזרה
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">שליחה חדשה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>כותרת</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='לדוגמה: "שדרוג למשכנתא — מפגש Q1"'
            />
          </div>
          <div className="space-y-1">
            <Label>גוף ההודעה</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="טקסט שיוצג לתלמיד בפעמון ההתראות..."
            />
          </div>
          <div className="space-y-1">
            <Label>קישור (לא חובה)</Label>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/chat או /mortgage"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>סטטוס משתמשים</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל המשתמשים</SelectItem>
                  <SelectItem value="approved">מאושרים בלבד</SelectItem>
                  <SelectItem value="pending">ממתינים</SelectItem>
                  <SelectItem value="rejected">נדחו</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>לא פעילים מעל (ימים)</Label>
              <Input
                type="number"
                min="0"
                value={inactiveDays}
                onChange={(e) => setInactiveDays(e.target.value)}
                placeholder="ריק = כולם"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm">
              נמענים משוערים:{' '}
              <span className="font-bold">
                {previewing ? '...' : preview ?? 0}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={previewCount} disabled={previewing}>
                רענן ספירה
              </Button>
              <Button onClick={send} disabled={sending || !preview}>
                {sending ? (
                  <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 ml-1" />
                )}
                שלח לכולם
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">היסטוריית שליחות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map((b) => (
              <div key={b.id} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{b.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(b.sent_at).toLocaleString('he-IL')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {b.body}
                </p>
                <p className="text-xs mt-2">
                  נשלח ל-<span className="font-bold">{b.total_recipients}</span>{' '}
                  משתמשים
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
