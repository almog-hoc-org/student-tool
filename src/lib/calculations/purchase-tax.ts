// מדרגות מס רכישה 2024 - ישראל
// מעודכן לפי רשות המסים

export type BuyerType = 'singleApartment' | 'additionalApartment' | 'foreignResident';

interface TaxBracket {
  upTo: number; // עד סכום (אינסוף = Infinity)
  rate: number; // שיעור המס
}

// דירה יחידה - מדרגות 2024
const SINGLE_APARTMENT_BRACKETS: TaxBracket[] = [
  { upTo: 1978745, rate: 0 },
  { upTo: 2347040, rate: 0.035 },
  { upTo: 3062435, rate: 0.05 },
  { upTo: 5195070, rate: 0.08 },
  { upTo: Infinity, rate: 0.10 },
];

// דירה נוספת / משקיע - מדרגות 2024
const ADDITIONAL_APARTMENT_BRACKETS: TaxBracket[] = [
  { upTo: 6055070, rate: 0.08 },
  { upTo: Infinity, rate: 0.10 },
];

// תושב חוץ - תוספת 2% על מדרגות דירה נוספת
const FOREIGN_RESIDENT_EXTRA_RATE = 0.02;

export interface PurchaseTaxInput {
  purchasePrice: number;
  buyerType: BuyerType;
}

export interface PurchaseTaxBracketResult {
  from: number;
  to: number;
  rate: number;
  taxInBracket: number;
}

export interface PurchaseTaxOutput {
  totalTax: number;
  effectiveRate: number;
  brackets: PurchaseTaxBracketResult[];
}

function calculateWithBrackets(price: number, brackets: TaxBracket[], extraRate: number = 0): PurchaseTaxOutput {
  let remaining = price;
  let totalTax = 0;
  let prevLimit = 0;
  const bracketResults: PurchaseTaxBracketResult[] = [];

  for (const bracket of brackets) {
    if (remaining <= 0) break;

    const bracketSize = bracket.upTo === Infinity ? remaining : Math.min(bracket.upTo - prevLimit, remaining);
    const rate = bracket.rate + extraRate;
    const taxInBracket = bracketSize * rate;

    bracketResults.push({
      from: prevLimit,
      to: prevLimit + bracketSize,
      rate,
      taxInBracket,
    });

    totalTax += taxInBracket;
    remaining -= bracketSize;
    prevLimit = bracket.upTo === Infinity ? prevLimit + bracketSize : bracket.upTo;
  }

  return {
    totalTax,
    effectiveRate: price > 0 ? totalTax / price : 0,
    brackets: bracketResults,
  };
}

export function calculatePurchaseTax(input: PurchaseTaxInput): PurchaseTaxOutput {
  const { purchasePrice, buyerType } = input;

  if (purchasePrice <= 0) {
    return { totalTax: 0, effectiveRate: 0, brackets: [] };
  }

  switch (buyerType) {
    case 'singleApartment':
      return calculateWithBrackets(purchasePrice, SINGLE_APARTMENT_BRACKETS);
    case 'additionalApartment':
      return calculateWithBrackets(purchasePrice, ADDITIONAL_APARTMENT_BRACKETS);
    case 'foreignResident':
      return calculateWithBrackets(purchasePrice, ADDITIONAL_APARTMENT_BRACKETS, FOREIGN_RESIDENT_EXTRA_RATE);
    default:
      return calculateWithBrackets(purchasePrice, SINGLE_APARTMENT_BRACKETS);
  }
}
