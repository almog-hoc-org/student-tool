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
// מקור האמת לתקרה הוא מדרגות המס עצמן — כאן רק re-export לנוחות
export { FIRST_HOME_TAX_FREE_CEILING as FIRST_HOME_EXEMPTION_CEILING } from '@/lib/calculations/purchase-tax';
