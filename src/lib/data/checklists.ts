export interface ChecklistItem {
  id: string;
  label: string;
  link?: string;
  autoKey?: string; // JourneyContext calculator type — auto-checks if data exists
}

export interface Checklist {
  id: string;
  title: string;
  description: string;
  items: ChecklistItem[];
}

export const checklists: Checklist[] = [
  {
    id: 'search-ready',
    title: 'מוכנים לחיפוש?',
    description: 'הכנות לפני שיוצאים לשוק',
    items: [
      { id: 'sr-1', label: 'בדיקה פיננסית — כמה אני יכול?', link: '/financial-checkup', autoKey: 'financial-checkup' },
      { id: 'sr-2', label: 'אישור עקרוני ממשכנתא' },
      { id: 'sr-3', label: 'בחירת עורך דין' },
      { id: 'sr-4', label: 'הגדרת קריטריונים (אזור, גודל, תקציב)' },
      { id: 'sr-5', label: 'הבנת מס רכישה — כמה אשלם?', link: '/purchase-tax' },
      { id: 'sr-6', label: 'הכנת רשימת שאלות לביקורים', link: '/property-visit' },
    ],
  },
  {
    id: 'before-signing',
    title: 'לפני חתימה על חוזה',
    description: 'בדיקות חובה לפני שחותמים',
    items: [
      { id: 'bs-1', label: 'נסח טאבו עדכני' },
      { id: 'bs-2', label: 'בדיקת היתרי בנייה' },
      { id: 'bs-3', label: 'שמאות מקצועית' },
      { id: 'bs-4', label: 'בדיקת חריגות בנייה' },
      { id: 'bs-5', label: 'חוות דעת עורך דין' },
      { id: 'bs-6', label: 'אישור עקרוני למשכנתא (סופי)' },
      { id: 'bs-7', label: 'בדיקת תוכנית עסקית / כדאיות', link: '/deal-business-plan', autoKey: 'deal-business-plan' },
      { id: 'bs-8', label: 'ביקור בנכס + הערכת מצב', link: '/property-visit', autoKey: 'property-visit' },
    ],
  },
  {
    id: 'closing-deal',
    title: 'סגירת עסקה',
    description: 'אחרי החתימה — מה צריך לעשות',
    items: [
      { id: 'cd-1', label: 'תשלום מס רכישה (תוך 60 יום)' },
      { id: 'cd-2', label: 'הגשת בקשה למשכנתא' },
      { id: 'cd-3', label: 'חתימה על שטר משכנתא' },
      { id: 'cd-4', label: 'רישום הערת אזהרה בטאבו' },
      { id: 'cd-5', label: 'ביטוח דירה + ביטוח חיים' },
      { id: 'cd-6', label: 'העברת חשבונות (ארנונה, חשמל, מים)' },
      { id: 'cd-7', label: 'מסירת מפתחות — בדיקה סופית' },
    ],
  },
];
