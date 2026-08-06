// מס הכנסה על שכירות למגורים — ישראל.
// שלושה מסלולים בחוק: פטור (עד התקרה), 10% על המחזור, מס שולי עם ניכויים.
// המנוע ממדל את שני הראשונים — מסלול המס השולי תלוי בנתוני המשכיר ואינו
// ניתן לחישוב אמין מכאן (מוצג לתלמיד כהערה).

// תקרת הפטור החודשית (2025) — מתעדכנת שנתית
export const RENTAL_TAX_EXEMPTION_CEILING_MONTHLY = 5_654;

export const RENTAL_FLAT_TAX_RATE = 0.10;

export type RentalTaxTrack = 'auto' | 'exempt' | 'flat10' | 'none';

export interface RentalTaxResult {
  monthlyTax: number;
  annualTax: number;
  effectiveTrack: 'exempt' | 'flat10' | 'none';
}

/**
 * מס חודשי על שכירות למגורים.
 * 'auto': עד התקרה — פטור מלא; מעל התקרה — מסלול 10% על מלוא המחזור
 * (המסלול הפשוט והנפוץ; מסלול "תקרה מתואמת" במס שולי עשוי להשתלם
 * במקרים מסוימים אך דורש את נתוני המס האישיים של המשכיר).
 * 'none': ללא מס — למשל דירה יחידה שהמשכיר גר בה חלקית או שימוש עסקי אחר.
 */
export function calculateRentalTax(
  monthlyRent: number,
  track: RentalTaxTrack = 'auto',
): RentalTaxResult {
  if (monthlyRent <= 0 || track === 'none') {
    return { monthlyTax: 0, annualTax: 0, effectiveTrack: 'none' };
  }

  if (track === 'exempt' || (track === 'auto' && monthlyRent <= RENTAL_TAX_EXEMPTION_CEILING_MONTHLY)) {
    // במסלול הפטור מעל התקרה יש חבות חלקית — אבל אז 'auto' כבר בוחר 10%,
    // ובחירה מפורשת ב'פטור' מעל התקרה מוצגת כ-0 עם אחריות על המשתמש (UI מזהיר).
    return { monthlyTax: 0, annualTax: 0, effectiveTrack: 'exempt' };
  }

  const monthlyTax = Math.round(monthlyRent * RENTAL_FLAT_TAX_RATE);
  return { monthlyTax, annualTax: monthlyTax * 12, effectiveTrack: 'flat10' };
}
