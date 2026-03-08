

# תוכנית שיפור — סריקה מקצה לקצה (Phase 7)

## ממצאים

### 1. TransactionTimeline — עדיין בעיצוב הישן לחלוטין
הדף הזה **לא תוקן** בסבבים הקודמים:
- Header: `border-0 shadow-lg` + `bg-gradient-to-r from-primary/5`
- כותרת `text-3xl font-bold` (במקום PageHero)
- שלבי עסקה: `border-0 shadow-md` + hardcoded gradients (`from-blue-50`, `from-emerald-50`, `from-orange-50`)
- כרטיס ציר זמן: `bg-gradient-to-r from-primary/10 to-secondary/10 border-0 shadow-lg`
- כרטיס טיפים: `bg-gradient-to-r from-accent/50 to-accent/30 border-0 shadow-lg`
- כותרות פנימיות: `text-2xl`, `text-xl` (גדולות מדי)
- כפתור חשב: `shadow-xl bg-gradient-to-r` (שונה מכל דף אחר)
- **אין** שימוש ב-PageHero, **אין** motion.div לתוצאות

### 2. PurchaseTaxCalculator — שומר על סכום בדף `deal` במקום `purchase-tax`
שורה 77: `saveCalculation({ type: 'deal', ...})` — שומר מס רכישה כסוג `deal` במקום סוג ייעודי. בדף Summary אין קטגוריה נפרדת למס רכישה.

### 3. Glossary ו-History ו-Dashboard — לא נבדקו בסבבים קודמים
צריך לוודא שהם עקביים.

### 4. בעיות קטנות נותרות
- **FinancialCheckup** — ה-empty state מוצג רק כש-`totalIncome === 0 && totalExpenses === 0`, אבל ברירות המחדל הן 15,000 ו-10,500 — כלומר ה-empty state **לעולם לא יוצג**. קוד מת.
- **TransactionTimeline** — KPI cards עם `animate-in slide-in-from-bottom` (animate utility class) במקום `motion.div` כמו שאר הדפים.

---

## תוכנית ביצוע

### A. תיקון TransactionTimeline (הכי שבור — נשכח בסבבים קודמים)
1. החלפת Header הישן ל-`PageHero`
2. כרטיס ציר זמן: `border shadow-sm` במקום `border-0 shadow-lg` + gradients
3. שלבי עסקה: `border shadow-sm` במקום `border-0 shadow-md` + hardcoded gradients
4. כותרות: `text-3xl` → `text-2xl`, `text-2xl` → `text-lg`
5. כפתור חשב: להסיר `shadow-xl bg-gradient-to-r` — להשתמש בסגנון אחיד
6. KPI: להחליף `animate-in` ב-`motion.div`
7. כרטיס טיפים: `border shadow-sm` במקום gradients

### B. תיקון PurchaseTaxCalculator save type
1. שורה 77: `type: 'deal'` → צריך ליצור סוג ייעודי או לשמור כ-`deal` עם title מבדל (כבר יש title מבדל, אבל הסוג מטעה). הפתרון הפשוט: להשאיר כ-deal כי אין סוג `purchase-tax` ב-types — פחות דחוף.

### C. ניקוי קוד מת
1. **FinancialCheckup**: להסיר empty state block (שורות 473-484) — קוד שלעולם לא יופעל.

### D. בדיקת דפים נוספים
1. לבדוק Glossary, History, Dashboard — אם יש חוסר עקביות.

---

## סדר עדיפויות
1. **A** — TransactionTimeline (הדף האחרון שלא הותאם)
2. **C** — ניקוי קוד מת
3. **B** — PurchaseTax save type (קוסמטי)

