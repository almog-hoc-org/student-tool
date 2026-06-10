/**
 * Single source of truth for shared Hebrew copy across the portal.
 * Anything that appears in more than one place — or is part of the
 * "הדרך לדירה" narrative the student sees — lives here.
 */

export const LABELS = {
  common: {
    selectPlaceholder: 'בחר…',
    notAvailable: 'לא זמין',
    loading: 'טוען…',
    retry: 'נסה שוב',
    optionalForInvestors: 'אופציונלי: למשקיעים',
    startHere: 'התחל כאן',
    next: 'הבא',
    back: 'הקודם',
    save: 'שמור',
    cancel: 'בטל',
    skip: 'דלג',
  },

  advisor: {
    title: 'יועץ חכם',
    subtitle: 'מבוסס AI',
    contextToggle: 'השתמש בנתונים שלי',
    contextHint: 'היועץ יראה את היעד, התקציב והמשכנתא שלך כדי לתת תשובה אישית.',
  },

  account: {
    avatarFallback: 'תמונת פרופיל',
    journeyTitle: 'המסע שלי לדירה',
  },

  goal: {
    title: 'היעד שלי',
    targetPriceLabel: 'מחיר יעד לדירה',
    targetPricePlaceholder: 'למשל 1,800,000',
    targetAreaLabel: 'אזור או עיר',
    targetAreaPlaceholder: 'למשל תל אביב, חיפה, פתח תקווה',
    targetDateLabel: 'מתי תרצה לקנות?',
    notesLabel: 'הערה (לא חובה)',
    skipLabel: 'אין לי יעד עדיין — אעדכן אחר כך',
    saved: 'היעד נשמר',
  },

  journey: {
    title: 'המסע שלי',
    currentStepPrefix: 'השלב הנוכחי:',
    nextStepCta: 'המשך לשלב הבא',
    steps: {
      goal: { name: 'הגדרת יעד', short: 'יעד' },
      budget: { name: 'תקציב', short: 'תקציב' },
      business_plan: { name: 'תוכנית עסקית', short: 'עסקה' },
      mortgage: { name: 'משכנתא', short: 'משכנתא' },
      property_check: { name: 'בדיקת נכס', short: 'נכס' },
      pre_purchase: { name: 'לפני רכישה', short: 'רכישה' },
    },
    prePurchase: {
      title: 'צ׳קליסט לפני חתימה',
      description: 'עברי על כל סעיף ודאג לסמן אותו לפני שתחתום.',
      items: [
        'בדיקת נסח טאבו / זכויות במנהל',
        'אישור היעדר חובות מהוועד / ארנונה',
        'בדיקת היתר בנייה ותב״ע',
        'דו״ח שמאי / שווי בטוחה',
        'הצעת מימון סופית מהבנק',
        'ערבות בנקאית (אם רוכשים מקבלן)',
        'בדיקת חוזה ע״י עו״ד מטעמך',
        'בדיקת רישום משכנתא ושטר משכון',
        'ביטוח מבנה + ביטוח חיים למשכנתא',
        'בדיקת חניה / מחסן / שטחים צמודים',
        'בדיקת ליקויים פיזיים (מומלץ בודק נכסים)',
        'הוכחת תשלום מס רכישה',
        'תיאום מועדי תשלום עם המוכר',
        'תיאום מועד מסירת מפתח',
        'פתיחת תיק טאבו / רישום זכויות',
      ],
    },
  },

  gap: {
    title: 'הפער שלך מהיעד',
    noGoal: 'הגדר יעד כדי לראות כמה את/ה רחוק/ה ממנו.',
    noBudget: 'מלא תקציב כדי שנדע מה ההון הנוכחי וההפקדה החודשית.',
    onTrack: 'את/ה בדרך הנכונה',
    behind: 'נדרשת התאמה',
    monthsLabel: 'חודשים עד היעד',
    requiredMonthlyLabel: 'חיסכון חודשי נדרש',
    gapLabel: 'פער הון',
  },

  empty: {
    dtiNeedsIncome: 'מלא הכנסה חודשית כדי לראות יחס DTI.',
    mortgageNeedsPrincipal: 'הזן סכום קרן במסלול כדי לראות תוצאות.',
    businessPlanNeedsPrice: 'הזן מחיר רכישה כדי לראות תוצאות.',
  },

  glossary: {
    readMore: 'קרא עוד',
  },

  toolNames: {
    budget: 'תקציב',
    mortgage: 'משכנתא',
    business_plan: 'תוכנית עסקית',
    property_check: 'בדיקת נכס',
  },
} as const;

export type Labels = typeof LABELS;
