/**
 * Regulatory constants — keep in one place so updates touch a single file.
 * Update INDEX_LAW_LABEL / EFFECTIVE_DATE when the law changes.
 */

export const INDEX_LAW_LABEL = 'חוק יוני 2025';
export const INDEX_LAW_EFFECTIVE_DATE = '2025-06-01';

export const INDEX_LAW_FREE_PORTION_PCT = 20;
export const INDEX_LAW_LINKED_EXPOSURE_PCT = 50;

export function indexLawNote(): string {
  return `כשקונים מקבלן, המחיר עולה בהתאם למדד עלויות הבנייה. ${INDEX_LAW_LABEL}: ${INDEX_LAW_FREE_PORTION_PCT}% הראשון פטור, השאר צמוד ב-${INDEX_LAW_LINKED_EXPOSURE_PCT}%.`;
}

export const PURCHASE_TAX_FREEZE_RANGE = '2025–2027';
export const FIRST_HOME_EXEMPTION_CEILING = 1_978_745;

// מגבלות בנק ישראל על משכנתאות (הוראות ניהול בנקאי תקין 329)
export const BOI_LIMITS = {
  MAX_DTI: 0.40,          // החזר חודשי מקסימלי מתוך ההכנסה הפנויה
  MAX_PRIME_SHARE: 0.66,  // חלק הפריים המקסימלי בתמהיל
  LTV_FIRST_HOME: 0.75,   // מימון מקסימלי - דירה יחידה
  LTV_UPGRADE: 0.70,      // מימון מקסימלי - משפרי דיור
  LTV_INVESTOR: 0.50,     // מימון מקסימלי - דירה נוספת / משקיע
} as const;

// הנחת ריבית ממוצעת למחשבון התקציב (מוצגת למשתמש וניתנת לשינוי)
export const BUDGET_DEFAULT_ANNUAL_RATE = 5.0;
