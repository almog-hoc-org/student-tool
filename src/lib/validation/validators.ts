import { he } from '../translations/he';

export const validators = {
  isPositiveNumber: (value: number): boolean => !isNaN(value) && value >= 0,
  isRequired: (value: any): boolean => 
    value !== null && value !== undefined && value !== '',
  isValidPercentage: (value: number): boolean => 
    !isNaN(value) && value >= 0 && value <= 100,
  isNonNegative: (value: number): boolean => !isNaN(value) && value >= 0,
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
  return `${value.toFixed(decimals)}%`;
};
