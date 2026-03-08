import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  getCalculationHistory,
  clearHistory,
  CalculationHistory,
} from '@/lib/storage/calculator-history';
import { FileText, Trash2, Download, CheckCircle2, Clock } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { toast } from '@/hooks/use-toast';
import { exportToPDF } from '@/lib/export/pdf-generator';

type CalcType = CalculationHistory['type'];

const calculatorMeta: Record<
  CalcType,
  { label: string; color: string }
> = {
  'financial-checkup': {
    label: 'צ׳קאפ פיננסי',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  mortgage: {
    label: 'מחשבון משכנתא',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  deal: {
    label: 'תוכנית עסקית לעסקה',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  'property-visit': {
    label: 'ביקור בנכס',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  },
  renovation: {
    label: 'כדאיות שיפוץ',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  'transaction-timeline': {
    label: 'ציר זמן עסקה',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  },
  'urban-renewal': {
    label: 'התחדשות עירונית',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  },
};

const ALL_TYPES: CalcType[] = [
  'financial-checkup',
  'mortgage',
  'deal',
  'property-visit',
  'renovation',
  'transaction-timeline',
  'urban-renewal',
];

function getLatestByType(history: CalculationHistory[]): Record<CalcType, CalculationHistory | null> {
  const map: Record<CalcType, CalculationHistory | null> = {
    'financial-checkup': null,
    mortgage: null,
    deal: null,
    'property-visit': null,
    renovation: null,
    'transaction-timeline': null,
    'urban-renewal': null,
  };
  // History is sorted newest-first, so the first match per type is the latest
  for (const item of history) {
    if (!map[item.type]) {
      map[item.type] = item;
    }
  }
  return map;
}

function renderDetails(item: CalculationHistory): React.ReactNode {
  return (
    <div className="space-y-1 text-sm">
      <p>{item.result}</p>
    </div>
  );
}

export default function Summary() {
  const [history, setHistory] = useState<CalculationHistory[]>(getCalculationHistory());
  const latestByType = getLatestByType(history);

  const handleClearAll = () => {
    clearHistory();
    setHistory([]);
    toast({
      title: 'הנתונים נוקו',
      description: 'כל ההיסטוריה נמחקה בהצלחה',
    });
  };

  const handleExportPDF = async () => {
    const sections = ALL_TYPES
      .filter((type) => latestByType[type])
      .map((type) => {
        const item = latestByType[type]!;
        return {
          title: calculatorMeta[type].label,
          items: [
            { label: 'כותרת', value: item.title },
            { label: 'תוצאה', value: item.result },
            {
              label: 'תאריך',
              value: new Date(item.timestamp).toLocaleDateString('he-IL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
            },
          ],
        };
      });

    if (sections.length === 0) {
      toast({
        title: 'אין נתונים',
        description: 'בצע לפחות חישוב אחד כדי לייצא PDF',
        variant: 'destructive',
      });
      return;
    }

    const completedCount = ALL_TYPES.filter((t) => latestByType[t]).length;

    await exportToPDF({
      title: 'סיכום כולל',
      subtitle: `${completedCount} מתוך ${ALL_TYPES.length} מחשבונים הושלמו`,
      executiveSummary: ALL_TYPES
        .filter((t) => latestByType[t])
        .map((t) => `${calculatorMeta[t].label}: ${latestByType[t]!.result}`),
      sections,
    });

    toast({
      title: 'PDF נוצר בהצלחה',
      description: 'הקובץ הורד למחשב שלך',
    });
  };

  const completedCount = ALL_TYPES.filter((t) => latestByType[t]).length;

  return (
    <div className="space-y-6 pb-8">
      <PageHero
        icon={<FileText className="w-6 h-6 text-primary" />}
        title="סיכום כולל"
        description="כל הנתונים שלך במקום אחד"
      />

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleExportPDF} variant="outline">
          <Download className="ml-2 h-4 w-4" />
          הורד PDF
        </Button>

        {history.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="ml-2 h-4 w-4" />
                נקה הכל
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                <AlertDialogDescription>
                  פעולה זו תמחק את כל ההיסטוריה ולא ניתן לבטלה.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ביטול</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll}>מחק הכל</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Progress indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              הושלמו {completedCount} מתוך {ALL_TYPES.length} מחשבונים
            </span>
            <div className="w-48 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(completedCount / ALL_TYPES.length) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculator summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_TYPES.map((type) => {
          const item = latestByType[type];
          const meta = calculatorMeta[type];

          return (
            <Card
              key={type}
              className={`transition-all duration-200 ${
                item ? 'border-border' : 'border-dashed border-muted-foreground/30 opacity-70'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">{meta.label}</CardTitle>
                  {item ? (
                    <Badge className={meta.color} variant="secondary">
                      <CheckCircle2 className="ml-1 h-3 w-3" />
                      הושלם
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Clock className="ml-1 h-3 w-3" />
                      טרם בוצע
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {item ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground truncate">{item.title}</p>
                    <div className="font-semibold text-sm">{renderDetails(item)}</div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">טרם בוצע</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
