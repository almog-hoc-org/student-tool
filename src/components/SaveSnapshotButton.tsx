import { useEffect, useState } from 'react';
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
import { saveSnapshot, updateSnapshot } from '@/lib/snapshots';

interface Props {
  toolKey: string;
  getData: () => unknown;
  disabled?: boolean;
  className?: string;
  buttonLabel?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  nameLabel?: string;
  namePlaceholder?: string;
  defaultName?: string;
  snapshotId?: string | null;
  initialName?: string;
  initialNotes?: string | null;
  onSaved?: () => void;
}

export function SaveSnapshotButton({
  toolKey,
  getData,
  disabled,
  className,
  buttonLabel = 'שמור תרחיש',
  dialogTitle = 'שמור תרחיש בשם',
  dialogDescription = 'שמירת התרחיש הזה כדי לחזור אליו אחר כך מהאזור האישי.',
  nameLabel = 'שם התרחיש',
  namePlaceholder = 'לדוגמה: "דירה בפ״ת — אפשרות א"',
  defaultName,
  snapshotId,
  initialName = '',
  initialNotes = '',
  onSaved,
}: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setNotes(initialNotes ?? '');
    }
  }, [open, initialName, initialNotes]);

  const handleSave = async () => {
    if (!user?.id) {
      toast.error('צריך להיות מחובר');
      return;
    }
    const trimmed = name.trim() || defaultName?.trim();
    if (!trimmed) {
      toast.error('תן שם לשמירה');
      return;
    }
    setSaving(true);
    try {
      if (snapshotId) {
        await updateSnapshot({
          id: snapshotId,
          name: trimmed,
          data: getData(),
          notes: notes.trim() || null,
        });
      } else {
        await saveSnapshot({
          userId: user.id,
          toolKey,
          name: trimmed,
          data: getData(),
          notes: notes.trim() || undefined,
        });
      }
      toast.success(snapshotId ? `עודכן: "${trimmed}"` : `נשמר: "${trimmed}"`);
      setOpen(false);
      if (!snapshotId) {
        setName('');
        setNotes('');
      }
      onSaved?.();
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
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="snap-name">{nameLabel}</Label>
            <Input
              id="snap-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={namePlaceholder}
              autoFocus
            />
            {defaultName && (
              <p className="text-[11px] text-muted-foreground">
                אם תשאיר ריק נשמור בשם: {defaultName}
              </p>
            )}
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
