import { RefreshCw } from 'lucide-react';
import { getToolUpdatedAt } from '@/lib/storage';

/**
 * "הנתונים כאן ישנים מהמקור" — מוצג כשכלי-מקור (למשל תקציב) עודכן אחרי
 * שהכלי הנוכחי נשמר לאחרונה. בלי זה שינוי הון עצמי בתקציב השאיר את
 * המשכנתא והתוכנית העסקית על המספרים הישנים לנצח, בלי שום חיווי.
 */
export function StaleDataNotice({
  sourceKey,
  sourceLabel,
  targetKey,
  onImport,
}: {
  sourceKey: string;
  sourceLabel: string;
  targetKey: string;
  onImport?: () => void;
}) {
  const sourceAt = getToolUpdatedAt(sourceKey);
  const targetAt = getToolUpdatedAt(targetKey);
  // מציגים רק כששני הכלים נשמרו והמקור חדש יותר (בהפרש שמעיד על עריכה אמיתית)
  if (!sourceAt || !targetAt || sourceAt.getTime() - targetAt.getTime() < 60_000) return null;

  return (
    <div className="rounded-xl border border-sky-300 bg-sky-50 dark:border-sky-700 dark:bg-sky-950/40 px-4 py-3 text-sm text-sky-800 dark:text-sky-300 flex items-start gap-2">
      <RefreshCw className="w-4 h-4 mt-0.5 shrink-0" />
      <div>
        {sourceLabel} עודכן ב-{sourceAt.toLocaleDateString('he-IL')} — אחרי הנתונים שכאן.
        {onImport ? (
          <>
            {' '}
            <button onClick={onImport} className="underline underline-offset-2 font-medium">
              ייבא את העדכון
            </button>
          </>
        ) : (
          ' שקול לייבא מחדש כדי שהמספרים יהיו עקביים.'
        )}
      </div>
    </div>
  );
}
