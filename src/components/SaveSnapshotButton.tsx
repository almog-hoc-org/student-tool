import { useState } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { saveSnapshot } from '@/lib/snapshots';

interface Props {
  toolKey: string;
  getData: () => unknown;
  disabled?: boolean;
  className?: string;
}

export function SaveSnapshotButton({ toolKey, getData, disabled, className }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user?.id) {
      toast.error('צריך להיות מחובר');
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('תן שם לתרחיש');
      return;
    }
    setSaving(true);
    try {
      await saveSnapshot({
        userId: user.id,
        toolKey,
        name: trimmed,
        data: getData(),
        notes: notes.trim() || undefined,
      });
      toast.success(`נשמר: "${trimmed}"`);
      setOpen(false);
      setName('');
      setNotes('');
    } catch (e) {
      toast.error('שגיאה בשמירה');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={className}
        >
          <Bookmark className="w-4 h-4 ml-1" />
          שמור תרחיש
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>שמור תרחיש בשם</DialogTitle>
          <DialogDescription>
            שמירת התרחיש הזה כדי לחזור אליו אחר כך מהאזור האישי.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="snap-name">שם התרחיש</Label>
            <Input
              id="snap-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='לדוגמה: "דירה בפ"ת — אפשרות א"'
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="snap-notes">הערות (לא חובה)</Label>
            <Textarea
              id="snap-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="פירוט / הקשר / החלטות"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 ml-1 animate-spin" />}
            שמור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
