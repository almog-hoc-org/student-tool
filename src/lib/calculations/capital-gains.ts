// מס שבח מקרקעין — דירות מגורים, ישראל.
// מודל לרכישות מ-1.1.2014 ואילך (בלי חישוב לינארי היסטורי): 25% על השבח הריאלי.
// השבח הריאלי = תמורה נטו פחות שווי הרכישה המתואם למדד ופחות ניכויים מוכרים.

export const SHEVACH_TAX_RATE = 0.25;

// תקרת הפטור לדירת מגורים מזכה יחידה (סעיף 49א(א1) לחוק מיסוי מקרקעין).
// מתעדכנת שנתית — לעדכן יחד עם שאר קבועי המס.
export const SINGLE_APARTMENT_EXEMPTION_CEILING = 5_008_000;

// אינפלציה שנתית לאומדן ההצמדה של שווי הרכישה (מדד המחירים לצרכן).
// אומדן חינוכי — השומה בפועל משתמשת במדדים המדויקים של חודשי הרכישה והמכירה.
export const DEFAULT_CPI_FOR_INDEXATION = 2.5;

export interface CapitalGainsInput {
  /** שווי רכישה */
  purchasePrice: number;
  /** ניכויים מוכרים ברכישה: מס רכישה, שכ"ט עו"ד, תיווך וכו' */
  acquisitionCosts?: number;
  /** השבחות מוכרות (שיפוץ מהותי) */
  improvementCosts?: number;
  /** תמורת המכירה */
  salePrice: number;
  /** הוצאות מכירה מוכרות: תיווך, עו"ד */
  sellingCosts?: number;
  /** שנות החזקה (לאומדן ההצמדה) */
  holdingYears: number;
  /** אינפלציה שנתית להצמדת הבסיס (ברירת מחדל 2.5%) */
  annualInflationPercent?: number;
  /** פטור דירת מגורים מזכה יחידה (המוכר מחזיק דירה אחת בלבד) */
  isExemptSingleApartment?: boolean;
}

export interface CapitalGainsOutput {
  /** שבח נומינלי: תמורה נטו פחות בסיס העלות */
  nominalGain: number;
  /** שבח ריאלי: תמורה נטו פחות הבסיס המוצמד */
  realGain: number;
  /** השבח החייב אחרי פטור (אם רלוונטי) */
  taxableRealGain: number;
  /** מס השבח לתשלום */
  tax: number;
  /** האם הופעל פטור דירה יחידה */
  exemptionApplied: boolean;
  /** האם התמורה עברה את תקרת הפטור (חיוב יחסי על העודף) */
  exemptionCapExceeded: boolean;
}

export function calculateCapitalGainsTax(input: CapitalGainsInput): CapitalGainsOutput {
  const acquisitionCosts = input.acquisitionCosts ?? 0;
  const improvementCosts = input.improvementCosts ?? 0;
  const sellingCosts = input.sellingCosts ?? 0;
  const inflation = (input.annualInflationPercent ?? DEFAULT_CPI_FOR_INDEXATION) / 100;

  const costBasis = input.purchasePrice + acquisitionCosts + improvementCosts;
  const netProceeds = input.salePrice - sellingCosts;
  const nominalGain = netProceeds - costBasis;

  // הצמדת הבסיס למדד — רק רכיב האינפלציה פטור ממס (מיסוי השבח הריאלי בלבד)
  const indexedBasis = costBasis * Math.pow(1 + inflation, Math.max(0, input.holdingYears));
  const realGain = netProceeds - indexedBasis;

  if (realGain <= 0) {
    return {
      nominalGain: Math.round(nominalGain),
      realGain: Math.round(realGain),
      taxableRealGain: 0,
      tax: 0,
      exemptionApplied: !!input.isExemptSingleApartment,
      exemptionCapExceeded: false,
    };
  }

  let taxableRealGain = realGain;
  let exemptionApplied = false;
  let exemptionCapExceeded = false;

  if (input.isExemptSingleApartment) {
    exemptionApplied = true;
    if (input.salePrice <= SINGLE_APARTMENT_EXEMPTION_CEILING) {
      taxableRealGain = 0;
    } else {
      // מעל התקרה: החלק היחסי של התמורה שמעל התקרה חייב במס (חישוב יחסי כבחוק)
      exemptionCapExceeded = true;
      taxableRealGain = realGain * ((input.salePrice - SINGLE_APARTMENT_EXEMPTION_CEILING) / input.salePrice);
    }
  }

  const tax = taxableRealGain * SHEVACH_TAX_RATE;

  return {
    nominalGain: Math.round(nominalGain),
    realGain: Math.round(realGain),
    taxableRealGain: Math.round(taxableRealGain),
    tax: Math.round(tax),
    exemptionApplied,
    exemptionCapExceeded,
  };
}
