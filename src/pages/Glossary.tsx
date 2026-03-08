import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Search } from 'lucide-react';
import { useState } from 'react';
import { PageHero } from '@/components/PageHero';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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
    definition: 'מס שמשולם למדינה בעת רכישת נכס. האחוז עולה בהתאם למחיר ומספר הדירות.',
    example: 'על דירה ראשונה עד 1,978,745 ₪ אין מס רכישה. על דירה שנייה: 8% מהשקל הראשון.',
    category: 'עלויות',
  },
  {
    term: 'דמי תיווך',
    definition: 'עמלה שמשולמת למתווך (בדרך כלל 2% + מע"מ ממחיר העסקה).',
    example: 'על דירה של 2 מיליון, דמי תיווך של 2%+מע"מ = כ-46,800 ₪.',
    category: 'עלויות',
  },
  // תשואה
  {
    term: 'תשואת שכירות',
    definition: 'הכנסה שנתית משכירות חלקי מחיר הנכס. מודד כמה הנכס "מרוויח" ביחס למחירו.',
    example: 'דירה ב-1.5 מיליון שמשכירים ב-5,000 ₪/חודש = תשואה של 4% (60,000/1,500,000).',
    category: 'תשואה',
  },
  {
    term: 'IRR (תשואה פנימית)',
    definition: 'שיעור התשואה השנתי הממוצע על ההשקעה, כולל תזרים שוטף ועליית ערך.',
    example: 'IRR של 12% אומר שההשקעה מניבה בממוצע 12% לשנה, כולל שכירות ומכירה.',
    category: 'תשואה',
  },
  {
    term: 'Cash on Cash (תשואה על הון עצמי)',
    definition: 'כמה תזרים מזומנים נקי מקבלים ביחס להון העצמי שהושקע.',
    example: 'השקעת 400,000 ₪ הון עצמי ומקבל 20,000 ₪ נקי בשנה = CoC של 5%.',
    category: 'תשואה',
  },
  {
    term: 'מנוף פיננסי (Leverage)',
    definition: 'שימוש בכסף של הבנק (משכנתא) כדי להגדיל את התשואה על ההון העצמי שלך.',
    example: 'אם הנכס עלה 5% ואתה מימנת רק 25% מההון — הרווח על ההון שלך הוא 20%.',
    category: 'תשואה',
  },
  // שיפוץ
  {
    term: 'מרווח ביטחון',
    definition: 'תוספת של 10-20% מעלות השיפוץ המתוכננת כנגד הפתעות.',
    example: 'אם השיפוץ מתוכנן ל-200,000 ₪, תקצב 230,000-240,000 ₪.',
    category: 'שיפוץ',
  },
  {
    term: 'עליית ערך מוספת (Value Uplift)',
    definition: 'ההפרש בין ערך הנכס אחרי שיפוץ לבין הערך לפני + עלות השיפוץ.',
    example: 'נכס ששווה 1.2M, שופץ ב-200K ועכשיו שווה 1.6M → עליית ערך מוספת של 200K.',
    category: 'שיפוץ',
  },
  // משפטי
  {
    term: 'נסח טאבו',
    definition: 'מסמך רשמי מרשם המקרקעין שמפרט בעלות, שעבודים והערות אזהרה על הנכס.',
    example: 'לפני רכישה חובה לבדוק נסח טאבו — לוודא שאין עיקולים או שעבודים.',
    category: 'משפטי',
  },
  {
    term: 'הערת אזהרה',
    definition: 'רישום בטאבו שמתריע שיש התחייבות כלפי הנכס (למשל חוזה מכר).',
    example: 'אחרי חתימת חוזה, רושמים הערת אזהרה כדי למנוע מהמוכר למכור לאחר.',
    category: 'משפטי',
  },
  {
    term: 'ייפוי כוח',
    definition: 'מסמך שמאפשר לעורך הדין לפעול בשמך — חובה ברכישת נכס.',
    example: 'נותנים ייפוי כוח לעו"ד כדי שיוכל לרשום הערת אזהרה ולהעביר בעלות.',
    category: 'משפטי',
  },
  // התחדשות עירונית
  {
    term: 'תמ"א 38',
    definition: 'תוכנית לחיזוק מבנים מפני רעידות אדמה, הכוללת בדרך כלל תוספת קומות ושדרוג.',
    example: 'בניין ישן מקבל חיזוק, מעלית, מרפסת חדשה ו-2 קומות נוספות ליזם.',
    category: 'התחדשות',
  },
  {
    term: 'פינוי בינוי',
    definition: 'הריסת בניין ישן ובניית בניין חדש תחתיו, כשהדיירים מקבלים דירות חדשות.',
    example: 'בניין של 30 דירות נהרס ובמקומו נבנה מגדל של 120 דירות.',
    category: 'התחדשות',
  },
];

export default function Glossary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [...new Set(terms.map(t => t.category))];

  const filteredTerms = terms.filter(term => {
    const matchesSearch = searchQuery === '' || 
      term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.definition.includes(searchQuery) ||
      (term.example && term.example.includes(searchQuery));
    const matchesCategory = !selectedCategory || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedTerms = filteredTerms.reduce((acc, term) => {
    if (!acc[term.category]) acc[term.category] = [];
    acc[term.category].push(term);
    return acc;
  }, {} as Record<string, Term[]>);

  return (
    <div className="space-y-6 pb-8">
      <PageHero
        icon={<BookOpen className="w-6 h-6 text-primary" />}
        title="מילון מונחים"
        description="נתקלתם במונח שלא הכרתם? כאן תמצאו הסברים פשוטים ודוגמאות ברורות לכל המושגים בעולם הנדל״ן"
      />

      {/* Search */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="חפש מונח או מילת מפתח..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Filter - scrollable on mobile */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}
          >
            הכל
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Terms */}
      <div className="space-y-6">
        {Object.entries(groupedTerms).map(([category, categoryTerms]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-lg font-bold text-primary">{category}</h2>
            <div className="grid gap-3">
              {categoryTerms.map((term, index) => (
                <Card key={index} className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{term.term}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">{term.definition}</p>
                    {term.example && (
                      <div className="bg-accent/50 rounded-lg p-3 text-sm">
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
        <Card className="border shadow-sm">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">לא נמצאו מונחים התואמים לחיפוש</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
