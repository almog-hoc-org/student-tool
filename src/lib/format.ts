/**
 * פורמט אחיד לכל המערכת. הקונבנציה: ₪ לפני המספר ("₪1,234"),
 * ללא ספרות אחרי הנקודה בסכומי כסף.
 */

export const formatCurrency = (value: number): string => {
  return `₪${value.toLocaleString('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

/** לצירי גרפים ומקומות צפופים: ₪850K / ₪1.2M */
export const formatCompactCurrency = (value: number): string => {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    return `${sign}₪${m >= 10 ? Math.round(m) : Number(m.toFixed(1))}M`;
  }
  if (abs >= 1_000) {
    const k = abs / 1_000;
    return `${sign}₪${k >= 10 ? Math.round(k) : Number(k.toFixed(1))}K`;
  }
  return `${sign}₪${abs.toLocaleString('he-IL')}`;
};

export const formatNumber = (value: number): string => {
  return value.toLocaleString('he-IL', { maximumFractionDigits: 0 });
};

export const formatPercent = (value: number, decimals: number = 2): string => {
  // Multiply by 100 since value is typically a decimal (e.g. 0.035 for 3.5%)
  return `${(value * 100).toFixed(decimals)}%`;
};
