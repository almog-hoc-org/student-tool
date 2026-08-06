import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, CloudOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { SaveStatus } from '@/lib/storage';
import { cn } from '@/lib/utils';

/**
 * חיווי שמירה אוטומטית — מאזין לאירועי tool-save-status מ-storage.ts.
 * לפני זה השמירה הייתה בלתי נראית לגמרי: תלמידים לא ידעו שהעבודה נשמרת,
 * וכישלון שמירה (אופליין) נבלע בשקט.
 */
export function SaveIndicator() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SaveStatus | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onStatus = (e: Event) => {
      const detail = (e as CustomEvent<{ status: SaveStatus }>).detail;
      if (!detail) return;
      setStatus(detail.status);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      // "נשמר" נעלם אחרי כמה שניות; שגיאה נשארת עד שמירה מוצלחת
      if (detail.status === 'saved') {
        hideTimer.current = setTimeout(() => setStatus(null), 3000);
      }
    };
    window.addEventListener('tool-save-status', onStatus);
    return () => {
      window.removeEventListener('tool-save-status', onStatus);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!user || !status) return null;

  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center gap-1 text-[11px] whitespace-nowrap',
        status === 'error' ? 'text-destructive' : 'text-muted-foreground',
      )}
    >
      {status === 'saving' && (
        <>
          <Loader2 className="w-3 h-3 animate-spin" /> שומר…
        </>
      )}
      {status === 'saved' && (
        <>
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> נשמר
        </>
      )}
      {status === 'error' && (
        <>
          <CloudOff className="w-3 h-3" /> השמירה לענן נכשלה — הנתונים שמורים מקומית
        </>
      )}
    </span>
  );
}
