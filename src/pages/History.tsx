import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  deleteCalculation,
  clearHistory,
  CalculationHistory,
} from '@/lib/storage/calculator-history';
import { History as HistoryIcon, Trash2, Calculator, FileText, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/validation/validators';
import { toast } from '@/hooks/use-toast';

const typeLabels: Record<CalculationHistory['type'], string> = {
  mortgage: 'משכנתא',
  'financial-checkup': 'צ\'ק-אפ פיננסי',
  deal: 'תוכנית עסקה',
  renovation: 'כדאיות שיפוץ',
  'property-visit': 'ביקור נכס',
  'transaction-timeline': 'ציר זמן עסקה',
  'urban-renewal': 'התחדשות עירונית',
};

const typeColors: Record<CalculationHistory['type'], string> = {
  mortgage: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'financial-checkup': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  deal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  renovation: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'property-visit': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'transaction-timeline': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'urban-renewal': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
};

export default function History() {
  const [history, setHistory] = useState<CalculationHistory[]>(getCalculationHistory());
  const [selectedType, setSelectedType] = useState<'all' | CalculationHistory['type']>('all');

  const handleDelete = (id: string) => {
    deleteCalculation(id);
    setHistory(getCalculationHistory());
    toast({
      title: 'נמחק בהצלחה',
      description: 'החישוב הוסר מההיסטוריה',
    });
  };

  const handleClearAll = () => {
    clearHistory();
    setHistory([]);
    toast({
      title: 'ההיסטוריה נוקתה',
      description: 'כל החישובים הוסרו',
    });
  };

  const filteredHistory =
    selectedType === 'all' ? history : history.filter((item) => item.type === selectedType);

  const stats = {
    total: history.length,
    mortgage: history.filter((h) => h.type === 'mortgage').length,
    'financial-checkup': history.filter((h) => h.type === 'financial-checkup').length,
    deal: history.filter((h) => h.type === 'deal').length,
    renovation: history.filter((h) => h.type === 'renovation').length,
    'property-visit': history.filter((h) => h.type === 'property-visit').length,
    'transaction-timeline': history.filter((h) => h.type === 'transaction-timeline').length,
    'urban-renewal': history.filter((h) => h.type === 'urban-renewal').length,
  };

  return (
    <div className="space-y-6 pb-8">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-background to-secondary/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-3">
                <HistoryIcon className="w-8 h-8" />
                היסטוריית חישובים
              </CardTitle>
              <CardDescription className="text-base mt-2">
                כל החישובים שביצעת נשמרים כאן למעקב ושיתוף
              </CardDescription>
            </div>
            {history.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
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
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">סה"כ חישובים</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Calculator className="w-10 h-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">משכנתאות</p>
                <p className="text-3xl font-bold">{stats.mortgage}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">צ'ק-אפ</p>
                <p className="text-3xl font-bold">{stats['financial-checkup']}</p>
              </div>
              <FileText className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">עסקאות</p>
                <p className="text-3xl font-bold">{stats.deal}</p>
              </div>
              <FileText className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              <TabsTrigger value="all">הכל ({stats.total})</TabsTrigger>
              <TabsTrigger value="mortgage">משכנתא</TabsTrigger>
              <TabsTrigger value="financial-checkup">צ'ק-אפ</TabsTrigger>
              <TabsTrigger value="deal">עסקה</TabsTrigger>
              <TabsTrigger value="renovation">שיפוץ</TabsTrigger>
              <TabsTrigger value="property-visit">ביקור</TabsTrigger>
              <TabsTrigger value="transaction-timeline">ציר זמן</TabsTrigger>
              <TabsTrigger value="urban-renewal">התחדשות</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <HistoryIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">אין חישובים שמורים</h3>
              <p className="text-muted-foreground">
                התחל לבצע חישובים והם יופיעו כאן אוטומטית
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>תאריך</TableHead>
                  <TableHead>סוג</TableHead>
                  <TableHead>כותרת</TableHead>
                  <TableHead>תוצאה</TableHead>
                  <TableHead className="text-left">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {new Date(item.timestamp).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge className={typeColors[item.type]} variant="secondary">
                        {typeLabels[item.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{item.title}</TableCell>
                    <TableCell className="font-semibold">{item.result}</TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>מחיקת חישוב</AlertDialogTitle>
                              <AlertDialogDescription>
                                האם אתה בטוח שברצונך למחוק חישוב זה?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.id)}>
                                מחק
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
