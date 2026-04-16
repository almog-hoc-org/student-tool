import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Copy, Trash2, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface InviteCode {
  id: string;
  code: string;
  cohort: string | null;
  max_uses: number;
  used_count: number;
  created_at: string;
  expires_at: string | null;
}

export default function AdminInviteCodes() {
  const { user } = useAuth();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [newCode, setNewCode] = useState('');
  const [newCohort, setNewCohort] = useState('');
  const [newMaxUses, setNewMaxUses] = useState(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCodes(); }, []);

  async function loadCodes() {
    setLoading(true);
    const { data } = await supabase
      .from('invite_codes')
      .select('*')
      .order('created_at', { ascending: false });
    setCodes(data ?? []);
    setLoading(false);
  }

  function generateRandomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setNewCode(code);
  }

  async function createCode() {
    if (!newCode.trim()) {
      toast.error('הכנס קוד');
      return;
    }
    const { error } = await supabase.from('invite_codes').insert({
      code: newCode.trim().toUpperCase(),
      cohort: newCohort.trim() || null,
      max_uses: newMaxUses,
      created_by: user?.id,
    });
    if (error) {
      if (error.code === '23505') toast.error('קוד כבר קיים');
      else toast.error('שגיאה ביצירת קוד');
    } else {
      toast.success('קוד נוצר');
      setNewCode('');
      setNewCohort('');
      loadCodes();
    }
  }

  async function deleteCode(id: string) {
    if (!window.confirm('בטוח למחוק את הקוד?')) return;
    await supabase.from('invite_codes').delete().eq('id', id);
    toast.success('קוד נמחק');
    loadCodes();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success('הועתק');
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">קודי הזמנה</h1>
        <Link to="/admin">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            חזרה
          </Button>
        </Link>
      </div>

      {/* Create new code */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            יצירת קוד חדש
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>קוד</Label>
              <div className="flex gap-2">
                <Input
                  value={newCode}
                  onChange={e => setNewCode(e.target.value.toUpperCase())}
                  placeholder="ABCD1234"
                  dir="ltr"
                />
                <Button variant="outline" size="sm" onClick={generateRandomCode}>
                  אקראי
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>קבוצה (אופציונלי)</Label>
              <Input
                value={newCohort}
                onChange={e => setNewCohort(e.target.value)}
                placeholder="מחזור 1"
              />
            </div>
            <div className="space-y-1.5">
              <Label>מקסימום שימושים</Label>
              <Input
                type="number"
                value={newMaxUses}
                onChange={e => setNewMaxUses(Number(e.target.value))}
                min={1}
              />
            </div>
          </div>
          <Button onClick={createCode} className="gap-2">
            <Plus className="w-4 h-4" />
            צור קוד
          </Button>
        </CardContent>
      </Card>

      {/* Existing codes */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">טוען...</p>
        ) : codes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">אין קודי הזמנה</p>
        ) : (
          codes.map(code => (
            <Card key={code.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-mono font-bold text-lg" dir="ltr">{code.code}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {code.cohort && <span>{code.cohort}</span>}
                      <span>{code.used_count}/{code.max_uses} שימושים</span>
                      <span>{new Date(code.created_at).toLocaleDateString('he-IL')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => copyCode(code.code)} title="העתק">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteCode(code.id)} title="מחק">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
