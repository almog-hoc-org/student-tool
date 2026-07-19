// קבועים פיננסיים — מקור אמת יחיד לכל המחשבונים.
// עדכון ריבית/רגולציה נוגע בקובץ הזה בלבד (טקסטים משפטיים: regulations.ts).

import type { BuyerType } from '@/lib/calculations/purchase-tax';

export const FINANCE = {
  BOI_RATE: 4.0,                  // ריבית בנק ישראל (פברואר 2026)
  PRIME_RATE: 5.5,                // פריים = בנק ישראל + 1.5%
  DEFAULT_MORTGAGE_RATE: 5.0,     // ריבית ברירת-מחדל אחידה לכל הערכה
  MAX_PRIME_SHARE: 0.66,          // מקסימום 66% מהתמהיל בפריים (הוראת בנק ישראל)
  MAX_DTI: 0.40,                  // תקרת יחס החזר מההכנסה נטו שהבנקים מאשרים
  VAT_RATE: 0.18,                 // מע"מ מ-1.1.2025
  DEFAULT_MADAD_RATE: 2.5,        // מדד תשומות הבנייה — שנתי
  MADAD_EXEMPT_PORTION: 0.20,     // חלק פטור מהצמדה ברכישה מקבלן
  MADAD_LINKED_PORTION: 0.50,     // שיעור ההצמדה על היתרה
  MADAD_EFFECTIVE_EXPOSURE: 0.40, // חשיפה אפקטיבית ≈ (1 − 20%) × 50%
} as const;

// תקרות מימון (LTV) לפי הוראות בנק ישראל
export const LTV_LIMITS = {
  firstHome: 0.75, // דירה יחידה
  upgrade: 0.70,   // משפרי דיור
  investor: 0.50,  // דירה נוספת / תושב חוץ
} as const;

export function getMaxLtv(buyerType: BuyerType): number {
  switch (buyerType) {
    case 'singleApartment':
      return LTV_LIMITS.firstHome;
    case 'additionalApartment':
    case 'foreignResident':
      return LTV_LIMITS.investor;
    default:
      return LTV_LIMITS.firstHome;
  }
}

// ההון העצמי המינימלי הנדרש לפי חוק, כשיעור ממחיר הנכס
export function getMinEquityShare(buyerType: BuyerType): number {
  return 1 - getMaxLtv(buyerType);
}
