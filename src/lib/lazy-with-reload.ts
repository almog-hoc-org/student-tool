import { lazy, type ComponentType } from 'react';

/**
 * React.lazy עם הגנה מפריסות: אחרי דיפלוי, ה-service worker החדש משתלט
 * ומנקה את המטמון הישן — וטעינת chunk של עמוד עצל מהגרסה הישנה נכשלת
 * ("נתקל בשגיאה" בלי שום בקשה לשרת). במקרה כזה מרעננים פעם אחת כדי
 * לקבל את ה-index החדש; שומרים דגל ב-sessionStorage כדי לא להיכנס ללולאה.
 */
export function lazyWithReload<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): ReturnType<typeof lazy<T>> {
  return lazy(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem('chunk_reload');
      return mod;
    } catch (error) {
      if (!sessionStorage.getItem('chunk_reload')) {
        sessionStorage.setItem('chunk_reload', '1');
        window.location.reload();
        // הרענון בדרך — מחזירים promise שלא נפתר כדי לא להציג שגיאה לרגע
        return new Promise<never>(() => {});
      }
      sessionStorage.removeItem('chunk_reload');
      throw error;
    }
  });
}
