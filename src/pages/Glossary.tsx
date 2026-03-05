import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Search } from 'lucide-react';
import { useState } from 'react';

interface Term {
  term: string;
  definition: string;
  example?: string;
  category: string;
}

const terms: Term[] = [
  // מימון ומשכנתאות
  {
    term: 'LTV (Loan to Value)',
    definition: 'יחס ההלוואה לערך הנכס. כמה אחוזים מערך הדירה אתה לוקח כמשכנתא.',
    example: 'אם הדירה עולה 2 מיליון ואתה לוקח משכנתא של 1.5 מיליון, ה-LTV הוא 75%.',
    category: 'מימון',
  },
  {
    term: 'הון עצמי',
    definition: 'הכסף שלך שאתה משקיע בעסקה - לא כולל משכנתא או הלוואות.',
    example: 'אם הדירה עולה 2 מיליון והמשכנתא 1.5 מיליון, ההון העצמי הוא 500,000 ₪.',
    category: 'מימון',
  },
  {
    term: 'ריבית פריים',
    definition: 'ריבית בסיסית שנקבעת על ידי בנק ישראל. משכנתאות בפריים משתנות לפי ריבית זו.',
    example: 'אם הפריים 6% והמסלול שלך פריים מינוס 0.5%, הריבית שלך היא 5.5%.',
    category: 'מימון',
  },
  {
    term: 'מסלול צמוד מדד',
    definition: 'מסלול משכנתא שבו הקרן עולה בהתאם למדד המחירים לצרכן (אינפלציה).',
    example: 'אם לקחת 100,000 ₪ והמדד עלה 3%, הקרן שלך עכשיו 103,000 ₪.',
    category: 'מימון',
  },
  {
    term: 'מסלול קבוע לא צמוד',
    definition: 'מסלול בטוח שבו הריבית קבועה לכל התקופה ואין הצמדה למדד.',
    example: 'הריבית 4.5% וההחזר 5,000 ₪ לחודש - נשאר אותו דבר ל-25 שנה.',
    category: 'מימון',
  },
  // עלויות
  {
    term: 'עלויות נלוות',
    definition: 'כל ההוצאות מעבר למחיר הדירה: מס רכישה, עורך דין, תיווך, שמאי ועוד.',
    example: 'לדירה של 2 מיליון צפה להוסיף כ-150,000-200,000 ₪ עלויות נלוות.',
    category: 'עלויות',
  },
  {
    term: 'מס רכישה',
    definition: 'מס שמשלמים למדינה בקניית דירה. האחוז משתנה לפי מחיר הדירה ואם זו דירה יחידה.',
    example: 'על דירה יחידה עד 1.9 מיליון אין מס. מעל זה - מתחיל ב-3.5%.',
    category: 'עלויות',
  },
  {
    term: 'מס שבח',
    definition: 'מס על הרווח במכירת דירה. לרוב פטור בדירה יחידה (עם תנאים).',
    example: 'קנית ב-1 מיליון, מכרת ב-1.5 מיליון. הרווח 500,000 ₪ - על זה משלמים מס.',
    category: 'עלויות',
  },
  // תשואות
  {
    term: 'תשואה ברוטו',
    definition: 'הכנסה שנתית משכירות חלקי מחיר הדירה, לפני הוצאות.',
    example: 'דירה ב-1 מיליון שמשכירים ב-4,000 ₪/חודש = 48,000 ₪/שנה = 4.8% תשואה ברוטו.',
    category: 'תשואות',
  },
  {
    term: 'תשואה נטו',
    definition: 'הכנסה שנתית משכירות אחרי הוצאות (ארנונה, ועד בית, תיקונים וכו\').',
    example: 'מ-48,000 ₪ הכנסה, אחרי הוצאות של 8,000 ₪ נשארים 40,000 ₪ = 4% נטו.',
    category: 'תשואות',
  },
  {
    term: 'תשואה על ההון (Cash on Cash)',
    definition: 'כמה אתה מרוויח ביחס לכסף שלך (לא כולל המשכנתא). המדד החשוב ביותר למשקיעים.',
    example: 'השקעת 500,000 ₪ הון עצמי ומרוויח 24,000 ₪ נטו בשנה = 4.8% תשואה על ההון.',
    category: 'תשואות',
  },
  // שיפוץ
  {
    term: 'מרווח ביטחון',
    definition: 'סכום נוסף שמוסיפים לתקציב השיפוץ למקרה של הפתעות. מומלץ 15-20%.',
    example: 'תקציב שיפוץ 200,000 ₪ + 15% מרווח = 230,000 ₪ תקציב כולל.',
    category: 'שיפוץ',
  },
  {
    term: 'עליית ערך (Value Uplift)',
    definition: 'כמה עולה ערך הדירה אחרי השיפוץ, ביחס לערך לפני.',
    example: 'דירה שווה 1.2 מיליון, אחרי שיפוץ שווה 1.5 מיליון = עליית ערך של 300,000 ₪.',
    category: 'שיפוץ',
  },
  // התחדשות עירונית
  {
    term: 'תמ"א 38',
    definition: 'תוכנית לחיזוק מבנים נגד רעידות אדמה, שכוללת הוספת דירות וקומות.',
    example: 'הבניין מקבל חיזוק, מעלית וחניה. הדיירים מקבלים ממ"ד ומרפסת.',
    category: 'התחדשות עירונית',
  },
  {
    term: 'פינוי-בינוי',
    definition: 'הריסת בניין ישן ובניית חדש במקומו. הדיירים מקבלים דירות חדשות.',
    example: 'דירת 70 מ"ר הופכת לדירת 100 מ"ר חדשה, עם מעלית וחניה.',
    category: 'התחדשות עירונית',
  },
  // תהליכים
  {
    term: 'בדיקת נאותות (Due Diligence)',
    definition: 'בדיקה מקיפה של הנכס והעסקה לפני הרכישה.',
    example: 'בדיקת נסח טאבו, היתרי בנייה, חובות לעירייה, מצב הבניין וכו\'.',
    category: 'תהליכים',
  },
  {
    term: 'נסח טאבו',
    definition: 'מסמך רשמי שמראה מי הבעלים של הנכס ואם יש עליו שעבודים או עיקולים.',
    example: 'בנסח רואים את שם הבעלים, גודל החלק, משכנתא רשומה והערות אזהרה.',
    category: 'תהליכים',
  },
  {
    term: 'הערת אזהרה',
    definition: 'רישום בטאבו שמודיע שיש התחייבות על הנכס (למשל, שהוא נמכר למישהו).',
    example: 'אחרי חתימת חוזה, רושמים הערת אזהרה כדי למנוע מכירה כפולה.',
    category: 'תהליכים',
  },
];

const categories = [...new Set(terms.map(t => t.category))];

export default function Glossary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTerms = terms.filter(term => {
    const matchesSearch = term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         term.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedTerms = filteredTerms.reduce((acc, term) => {
    if (!acc[term.category]) acc[term.category] = [];
    acc[term.category].push(term);
    return acc;
  }, {} as Record<string, Term[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 py-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">מילון מונחים</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            נתקלתם במונח שלא הכרתם? כאן תמצאו הסברים פשוטים ודוגמאות ברורות לכל המושגים החשובים בעולם הנדל״ן והמשכנתאות
          </p>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="הקלידו מונח או מילת מפתח לחיפוש..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            הכל
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Terms */}
        <div className="space-y-6">
          {Object.entries(groupedTerms).map(([category, categoryTerms]) => (
            <div key={category} className="space-y-3">
              <h2 className="text-xl font-bold text-primary">{category}</h2>
              <div className="grid gap-3">
                {categoryTerms.map((term, index) => (
                  <Card 
                    key={index} 
                    className="border-0 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{term.term}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-muted-foreground">{term.definition}</p>
                      {term.example && (
                        <div className="bg-primary/5 rounded-lg p-3 text-sm">
                          <span className="font-medium text-primary">דוגמה: </span>
                          {term.example}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredTerms.length === 0 && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">לא נמצאו מונחים התואמים לחיפוש</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
