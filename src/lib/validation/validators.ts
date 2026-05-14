import { he } from '../translations/he';

type FieldValue = string | number | null | undefined;

export const validators = {
  isPositiveNumber: (value: number): boolean => !isNaN(value) && value >= 0,
  isRequired: (value: FieldValue): boolean => {
    if (typeof value === 'number') return !isNaN(value);
    return value !== null && value !== undefined && value !== '';
  },
  isValidPercentage: (value: number): boolean =>
    !isNaN(value) && value >= 0 && value <= 100,
  isNonNegative: (value: number): boolean => !isNaN(value) && value >= 0,
  isValidNumber: (value: FieldValue): boolean => {
    return !isNaN(Number(value)) && value !== '' && value !== null && value !== undefined;
  },
};

export const validateField = (
  value: FieldValue,
  rules: {
    required?: boolean;
    positive?: boolean;
    nonNegative?: boolean;
    percentage?: boolean;
    min?: number;
    max?: number;
  }
): string | null => {
  if (rules.required && !validators.isRequired(value)) {
    return he.validation.required;
  }

  const numValue = Number(value);

  if (value !== '' && value !== null && value !== undefined) {
    if (!validators.isValidNumber(value)) {
      return he.validation.invalidNumber;
    }

    if (rules.positive && numValue <= 0) {
      return he.validation.mustBePositive;
    }

    if (rules.nonNegative && numValue < 0) {
      return he.validation.mustBeNonNegative;
    }

    if (rules.percentage && !validators.isValidPercentage(numValue)) {
      return he.validation.invalidPercentage;
    }

    if (rules.min !== undefined && numValue < rules.min) {
      return `הערך חייב להיות לפחות ${rules.min}`;
    }

    if (rules.max !== undefined && numValue > rules.max) {
      return `הערך לא יכול לעבור ${rules.max}`;
    }
  }

  return null;
};

export const getValidationMessage = (
  type: keyof typeof he.validation
): string => {
  return he.validation[type];
};

export const formatCurrency = (value: number): string => {
  return `₪${value.toLocaleString('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const formatPercent = (value: number, decimals: number = 2): string => {
  // Multiply by 100 since value is typically a decimal (e.g. 0.035 for 3.5%)
  return `${(value * 100).toFixed(decimals)}%`;
};

/** Smart warnings - not blocking, just informational */
export function getSmartWarnings(fieldName: string, value: number, context?: Record<string, number>): string | null {
  if (value < 0) return 'ערך לא יכול להיות שלילי';

  switch (fieldName) {
    case 'expectedMonthlyRent':
      if (context?.purchasePrice && value > 0) {
        const rentRatio = (value * 12) / context.purchasePrice;
        if (rentRatio > 0.08) return 'שכירות גבוהה מאוד יחסית למחיר הנכס - בדוק שוב';
      }
      break;
    case 'annualInterestRate':
    case 'mortgageInterestRate':
      if (value > 10) return 'ריבית גבוהה מאוד - נכון?';
      if (value > 0 && value < 1) return 'שים לב - ריבית נמוכה מאוד';
      break;
    case 'totalExpenses':
      if (context?.totalIncome && value > context.totalIncome) return 'שים לב - הוצאות גבוהות מהכנסות';
      break;
    case 'holdingPeriodYears':
      if (value > 30) return 'תקופה ארוכה מאוד - בדוק שוב';
      break;
  }
  return null;
}

/** Smart defaults for common fields */
export const SMART_DEFAULTS: Record<string, { value: number; label: string }> = {
  annualInsurance: { value: 3000, label: 'ביטוח בניין ממוצע' },
  annualPropertyTax: { value: 5000, label: 'ארנונה ממוצעת' },
  annualMaintenance: { value: 3600, label: 'ועד בית ממוצע (300/חודש)' },
  occupancyRate: { value: 0.95, label: 'תפוסה סטנדרטית (95%)' },
  annualAppreciation: { value: 3, label: 'עליית ערך ממוצעת (3%)' },
};
