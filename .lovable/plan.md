

# תוכנית שיפור — סריקה מקצה לקצה

## ממצאים עיקריים

### 1. חוסר עקביות בעיצוב בין דפים (עדיין קיים)
למרות שיפורים קודמים, עדיין יש פערים:
- **PropertyVisit** ו-**UrbanRenewal** — עדיין משתמשים בעיצוב הישן: `border-0 shadow-lg`, `text-3xl`, hardcoded gradients (`bg-blue-500`, `bg-emerald-500`, `bg-orange-500`, `from-blue-50`, `from-emerald-50`)
- **PurchaseTaxCalculator** — `border border-border/60` במקום `border shadow-sm` כמו שאר הדפים
- **TransactionTimeline** — `purchasePrice` מאותחל ל-0 (לא כמו שאר הדפים שקיבלו ברירות מחדל)
- **UrbanRenewal** — דף מידע בלבד, לא מחשבון, אבל העיצוב שלו שונה לחלוטין משאר המערכת

### 2. PropertyVisit — הדף הכי "שבור" עיצובית
- Header: `border-0 shadow-lg` + `bg-gradient-to-r from-primary/5`
- כרטיסי סקשן: `border-0 shadow-lg` + `bg-gradient-to-r from-blue-50` + `bg-blue-500` (hardcoded)
- תוצאות: `border-0 shadow-xl`, `text-2xl`, `text-5xl font-bold`, hardcoded `bg-emerald-500`, `bg-orange-500`, `bg-purple-500`
- לא משתמש ב-PageHero, לא משתמש ב-motion.div לתוצאות
- כפתור חשב ב-`bottom-8` במקום `bottom-20 md:bottom-8`

### 3. UrbanRenewal — חוסר עקביות
- Header: `border-0 shadow-lg` + `text-3xl font-bold`
- כרטיסים: `border-0 shadow-lg` + `bg-gradient-to-r from-primary/10 to-secondary/10`
- hardcoded gradient colors (`from-blue-50`, `from-emerald-50`, etc.)

### 4. TransactionTimeline — ברירות מחדל חסרות
- `purchasePrice` מאותחל ל-0 — בעוד שכל שאר המחשבונים קיבלו ברירות מחדל ריאליסטיות

### 5. "מגורים עצמיים" (ownUse) — עדיין ריק
- בתוכנית עסקית, בחירת "מגורים עצמיים" מציגה רק `totalDealCost` ו-`Weak`. אין חישוב ייחודי.

### 6. בעיות קטנות נוספות
- **Summary page**: `renderDetails` עושה switch-case שמחזיר בדיוק אותו JSX לכל type — קוד מיותר
- **ExecutiveSummary**: `border-0 glass-card-elevated` — שונה מסגנון `border shadow-sm` של שאר הכרטיסים

---

## תוכנית ביצוע

### A. תיקון PropertyVisit (הכי דחוף — הדף הכי לא מותאם)
1. החלפת Header ל-`PageHero`
2. כל Cards: `border shadow-sm` במקום `border-0 shadow-lg`
3. הסרת hardcoded colors (`bg-blue-500`, `bg-emerald-500`, `bg-orange-500`, `bg-purple-500`) → `bg-primary`, `bg-primary/10`
4. הסרת gradients hardcoded → `bg-accent/50`
5. כותרות: `text-2xl` → `text-lg`, `text-5xl` → `text-3xl`
6. תוצאות: עטיפה ב-`motion.div`
7. כפתור: `bottom-8` → `bottom-20 md:bottom-8`

### B. תיקון UrbanRenewal
1. החלפת Header ל-`PageHero`
2. כל Cards: `border shadow-sm` במקום `border-0 shadow-lg`
3. הסרת hardcoded gradients → שימוש בצבעי מערכת
4. כותרות: `text-3xl` → `text-lg`, `text-2xl` → `text-lg`

### C. תיקון PurchaseTaxCalculator
1. `border border-border/60` → `border shadow-sm` (אחידות)
2. הסרת `max-w-5xl mx-auto px-4 sm:px-6` — לא קיים בדפים אחרים, ה-Layout כבר מטפל ב-padding

### D. TransactionTimeline — ברירת מחדל
1. `purchasePrice: 0` → `purchasePrice: 1800000`

### E. הוספת חישוב "מגורים עצמיים"
1. בתוכנית עסקית, כשבוחרים `ownUse`:
   - להציג שדות: שכירות חלופית חודשית, עלויות חודשיות (ארנונה + ועד בית)
   - חישוב: עלות חודשית בעלות (משכנתא + ארנונה + ועד) vs שכירות חלופית
   - הצגת "נקודת איזון" — אחרי כמה שנים הרכישה משתלמת
2. עדכון types ב-`deal-business-plan.ts` ו-calculation logic

### F. ניקוי קוד קטן
1. Summary `renderDetails` — לפשט (לא צריך switch-case)
2. ExecutiveSummary: `border-0 glass-card-elevated` → `border shadow-sm` לאחידות

---

## סדר עדיפויות
1. **A** — PropertyVisit (הכי שבור)
2. **B** — UrbanRenewal
3. **C+D** — PurchaseTax + Timeline (תיקונים קטנים)
4. **F** — ניקוי קוד
5. **E** — מגורים עצמיים (פיצ'ר חדש אבל חשוב לשלמות)

