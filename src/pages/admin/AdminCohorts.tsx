import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Users2, Send, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CohortRow {
  cohort: string;
  member_count: number;
}

export default function AdminCohorts() {
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [atRiskCount, setAtRiskCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCohort, setSelectedCohort] = useState<string | 'at_risk' | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [enrollRes, atRiskRes] = await Promise.all([
          supabase.from('enrollments').select('cohort'),
          supabase.from('profiles').select('user_id', { count: 'exact', head: true }).eq('at_risk_flag', true),
        ]);

        if (enrollRes.error) throw enrollRes.error;
        const counts = new Map<string, number>();
        for (const e of enrollRes.data ?? []) {
          if (!e.cohort) continue;
          counts.set(e.cohort, (counts.get(e.cohort) ?? 0) + 1);
        }
        setCohorts(Array.from(counts.entries()).map(([cohort, member_count]) => ({ cohort, member_count })));
        setAtRiskCount(atRiskRes.count ?? 0);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'שגיאה');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const targetLabel = useMemo(() => {
    if (selectedCohort === 'at_risk') return `${atRiskCount} תלמידים בסיכון`;
    if (selectedCohort) {
      const c = cohorts.find(c => c.cohort === selectedCohort);
      return `${c?.member_count ?? 0} תלמידים ב-${selectedCohort}`;
    }
    return '';
  }, [selectedCohort, cohorts, atRiskCount]);

  const send = async () => {
    if (!selectedCohort || !subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      const args = { _title: subject.trim(), _body: body.trim(), _link: link || null };
      const result = selectedCohort === 'at_risk'
        ? await supabase.rpc('admin_send_notification_to_at_risk', { ...args, _category: 'reminder' })
        : await supabase.rpc('admin_send_notification_to_cohort', {
            ...args, _cohort: selectedCohort, _category: 'announcement',
          });

      if (result.error) throw result.error;
      toast.success(`נשלחה התראה ל-${result.data} תלמידים`);
      setSubject(''); setBody(''); setLink(''); setSelectedCohort(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <Link to="/admin">
          <Button variant="ghost" size="sm" className="gap-1 mb-2">
            <ArrowRight className="w-4 h-4" />
            חזרה
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users2 className="w-6 h-6" />
          קבוצות ושליחה bulk
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          קיבוץ לפי cohort של invite-code. בחר יעד והודעה לשליחה לכולם בבת אחת.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">טוען...</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">בחר יעד</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                type="button"
                onClick={() => setSelectedCohort('at_risk')}
                className={`w-full text-right rounded-lg border p-3 transition ${
                  selectedCohort === 'at_risk' ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    תלמידים בסיכון
                  </span>
                  <Badge variant="secondary">{atRiskCount}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">לא פעילים 14 ימים עם שיעורים פתוחים</p>
              </button>

              {cohorts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 text-center">
                  אין cohorts מוגדרים. כדי לקבץ — צור invite codes עם שדה cohort.
                </p>
              ) : (
                cohorts.map(c => (
                  <button
                    key={c.cohort}
                    type="button"
                    onClick={() => setSelectedCohort(c.cohort)}
                    className={`w-full text-right rounded-lg border p-3 transition ${
                      selectedCohort === c.cohort ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c.cohort}</span>
                      <Badge variant="secondary">{c.member_count}</Badge>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {selectedCohort && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  הודעה ל-{targetLabel}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="כותרת"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
                <Textarea
                  rows={5}
                  placeholder="תוכן ההודעה"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                />
                <Input
                  placeholder="קישור in-app (אופציונלי) — למשל /learn/way-to-apartment"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCohort(null)} disabled={sending}>
                    ביטול
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={send}
                    disabled={sending || !subject.trim() || !body.trim()}
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    שלח לכולם
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
