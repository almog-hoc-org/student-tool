import { he } from '../translations/he';

export const validators = {
  isPositiveNumber: (value: number): boolean => !isNaN(value) && value >= 0,
  isRequired: (value: any): boolean => {
    if (typeof value === 'number') return !isNaN(value);
    return value !== null && value !== undefined && value !== '';
  },
  isValidPercentage: (value: number): boolean => 
    !isNaN(value) && value >= 0 && value <= 100,
  isNonNegative: (value: number): boolean => !isNaN(value) && value >= 0,
  isValidNumber: (value: any): boolean => {
    return !isNaN(Number(value)) && value !== '' && value !== null && value !== undefined;
  },
};

export const validateField = (
  value: any,
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
