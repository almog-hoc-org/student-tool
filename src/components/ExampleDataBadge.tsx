import { Lightbulb } from 'lucide-react';

/**
 * מוצג מעל תוצאות שחושבו מנתוני הדוגמה המובנים — לפני שהתלמיד הזין
 * אף ערך משלו. בלעדיו המסך הראשון הציג "שווי דירה מקסימלי" כאילו
 * הוא אישי, ותלמידים ציטטו אותו כמסקנה אמיתית.
 */
export function ExampleDataBadge({ onReset }: { onReset?: () => void }) {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
      <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
      <div>
        <span className="font-semibold">אלה נתוני דוגמה להתרשמות.</span>{' '}
        המספרים כאן לא מבוססים על המצב שלך — עדכן את השדות משמאל כדי לקבל תוצאה אישית.
        {onReset && (
          <>
            {' '}
            <button onClick={onReset} className="underline underline-offset-2 font-medium">
              התחל מנתונים ריקים
            </button>
          </>
        )}
      </div>
    </div>
  );
}
