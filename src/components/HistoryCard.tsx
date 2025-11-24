import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, ChevronLeft, Trash2 } from 'lucide-react';
import { CalculationHistory, deleteCalculation } from '@/lib/storage/calculator-history';

interface HistoryCardProps {
  items: CalculationHistory[];
  onItemClick?: (item: CalculationHistory) => void;
  onRefresh?: () => void;
}

export function HistoryCard({ items, onItemClick, onRefresh }: HistoryCardProps) {
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteCalculation(id);
    onRefresh?.();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (items.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            היסטוריית חישובים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">אין חישובים שמורים עדיין</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          היסטוריית חישובים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 cursor-pointer transition-all group"
            onClick={() => onItemClick?.(item)}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.title}</p>
              <p className="text-sm text-primary truncate">{item.result}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(item.timestamp)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDelete(e, item.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        ))}
        {items.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            ועוד {items.length - 5} חישובים נוספים
          </p>
        )}
      </CardContent>
    </Card>
  );
}
