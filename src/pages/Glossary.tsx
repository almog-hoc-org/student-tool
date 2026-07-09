import { useMemo, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { EmptyState } from '@/components/ui/empty-state';
import { GLOSSARY, TERM_CATEGORIES, type TermKey } from '@/lib/glossary';

export default function Glossary() {
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const q = query.trim();
    const entries = (Object.entries(GLOSSARY) as [TermKey, typeof GLOSSARY[TermKey]][])
      .filter(([, e]) => !q || e.term.includes(q) || e.short.includes(q) || e.long.includes(q));
    return TERM_CATEGORIES
      .map(category => ({
        category,
        terms: entries.filter(([, e]) => e.category === category),
      }))
      .filter(g => g.terms.length > 0);
  }, [query]);

  const totalTerms = Object.keys(GLOSSARY).length;

  return (
    <div dir="rtl" className="max-w-3xl mx-auto space-y-6">
      <section className="rounded-lg border bg-card p-5 sm:p-7 space-y-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <BookOpen className="h-4 w-4" />
            מילון מושגים
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            כל המושגים של הדרך לדירה
          </h1>
          <p className="text-sm leading-7 text-muted-foreground">
            {totalTerms} מושגים בשפה פשוטה — משכנתא, מיסים, תהליך הרכישה והשקעות.
            אפשר לחפש או לדפדף לפי נושא.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חפש מושג… (למשל: מס שבח, פריים, טאבו)"
            className="h-12 pr-9 text-base"
            aria-label="חיפוש מושג"
          />
        </div>
      </section>

      {grouped.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-6 h-6" />}
          title="לא נמצאו מושגים"
          description={`אין תוצאות עבור "${query}". נסה מילה אחרת או קצרה יותר.`}
        />
      ) : (
        grouped.map(({ category, terms }) => (
          <Card key={category} className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {category}
                <span className="mr-2 font-normal">({terms.length})</span>
              </h2>
              <Accordion type="multiple" className="w-full">
                {terms.map(([key, entry]) => (
                  <AccordionItem key={key} value={key}>
                    <AccordionTrigger className="text-right hover:no-underline">
                      <div className="space-y-0.5 text-right">
                        <p className="font-semibold">{entry.term}</p>
                        <p className="text-xs font-normal text-muted-foreground leading-relaxed">
                          {entry.short}
                        </p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm leading-7 text-muted-foreground">{entry.long}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
