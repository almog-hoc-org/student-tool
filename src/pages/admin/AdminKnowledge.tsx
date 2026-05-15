import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Brain, Plus, Trash2, Loader2, RefreshCcw, FileText, Sparkles,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SourceRow {
  source_id: string;
  source_file: string;
  chunk_count: number;
  updated_at: string;
}

export default function AdminKnowledge() {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      // Group by source_id, count chunks, take max updated_at
      const { data, error } = await supabase
        .from('knowledge_chunks')
        .select('source_id, source_file, updated_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      const map = new Map<string, SourceRow>();
      for (const r of data ?? []) {
        const sid = r.source_id ?? r.source_file;
        const existing = map.get(sid);
        if (existing) {
          existing.chunk_count++;
        } else {
          map.set(sid, {
            source_id: sid,
            source_file: r.source_file,
            chunk_count: 1,
            updated_at: r.updated_at,
          });
        }
      }
      setSources(Array.from(map.values()));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה בטעינה');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  async function submit() {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('ingest-content', {
        body: {
          source_file: title.trim(),
          content: content.trim(),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`נטען. ${data.chunks_inserted} קטעים נכנסו למוח הצ׳אט.`);
      setTitle('');
      setContent('');
      setShowForm(false);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה בהזנה');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteSource(sourceId: string, sourceName: string) {
    if (!window.confirm(`למחוק את "${sourceName}" מהמוח של הצ׳אט?`)) return;
    try {
      const { error } = await supabase
        .from('knowledge_chunks')
        .delete()
        .eq('source_id', sourceId);
      if (error) throw error;
      toast.success('נמחק');
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה במחיקה');
    }
  }

  const totalChunks = sources.reduce((s, r) => s + r.chunk_count, 0);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6" />
            מוח הצ׳אט AI
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            התוכן שמופיע כאן הוא הבסיס שעליו הצ׳אט עונה לתלמידים (RAG).
            ההזנה תומכת בטקסט חופשי או markdown — Gemini ייצור embeddings ויאחסן בחתיכות.
          </p>
        </div>
        <Link to="/admin">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            חזרה
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">{sources.length} מקורות · {totalChunks} קטעים</p>
              <p className="text-xs text-muted-foreground">
                {totalChunks === 0
                  ? 'הצ׳אט עונה generically. הזן תוכן כדי לבסס תשובות על חומר הקורס.'
                  : 'הצ׳אט מחפש בחתיכות לפי דמיון סמנטי ומצטט את שם המקור.'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={reload} className="gap-1">
              <RefreshCcw className="w-4 h-4" />
              רענן
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1">
              <Plus className="w-4 h-4" />
              הוסף תוכן
            </Button>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">הזנת מקור חדש</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">שם המקור</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="לדוגמה: מדריך משכנתאות 2026"
              />
              <p className="text-xs text-muted-foreground mt-1">
                השם הזה יוצג לתלמיד כציטוט בסוף תשובת הצ׳אט.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">תוכן (טקסט/markdown)</label>
              <Textarea
                rows={16}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="הדבק כאן את התוכן. ככל שיותר ספציפי לקורס — ככה התשובות מדויקות יותר."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                המערכת תחלק לקטעים של ~280 מילים עם חפיפה, ותחשב embedding לכל קטע.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => { setShowForm(false); setTitle(''); setContent(''); }}
                disabled={submitting}
              >
                ביטול
              </Button>
              <Button
                onClick={submit}
                disabled={submitting || !title.trim() || !content.trim()}
                className="gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                שמור והכנס למוח
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">מקורות פעילים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">טוען...</p>
          ) : sources.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>אין עדיין מקורות. לחץ על "הוסף תוכן" כדי להזין את הראשון.</p>
            </div>
          ) : (
            sources.map(s => (
              <div key={s.source_id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{s.source_file}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{s.chunk_count} קטעים</Badge>
                      <span className="text-xs text-muted-foreground">
                        עודכן {new Date(s.updated_at).toLocaleString('he-IL')}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteSource(s.source_id, s.source_file)}
                  className="text-destructive hover:text-destructive shrink-0"
                  title="מחק"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
