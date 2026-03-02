import { useState, useEffect, useCallback } from 'react';
import {
  calculateSideCosts,
  SideCostsInput,
  SideCostItem,
  getDefaultSideCostsInput,
} from '@/lib/calculations/side-costs';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/validation/validators';
import { cn } from '@/lib/utils';

interface HiddenCostsChecklistProps {
  purchasePrice: number;
  onChange?: (totalCosts: number, items: SideCostItem[]) => void;
  className?: string;
}

// Each row in the checklist UI
interface ChecklistRow {
  key: string;
  name: string;
  description: string;
  inputField: keyof SideCostsInput | null; // null = always included (no toggle in SideCostsInput)
  alwaysOn: boolean;
}

const CHECKLIST_ROWS: ChecklistRow[] = [
  {
    key: 'lawyer',
    name: 'עורך דין',
    description: 'ליווי משפטי וחוזה רכישה',
    inputField: null,
    alwaysOn: true,
  },
  {
    key: 'broker',
    name: 'תיווך',
    description: 'עמלת מתווך כולל מע"מ',
    inputField: 'includeBroker',
    alwaysOn: false,
  },
  {
    key: 'appraisal',
    name: 'שמאי מקרקעין',
    description: 'הערכת שווי הנכס',
    inputField: 'includeAppraisal',
    alwaysOn: false,
  },
  {
    key: 'inspection',
    name: 'בדק בית (מהנדס)',
    description: 'בדיקת מצב פיזי הנכס',
    inputField: 'includeInspection',
    alwaysOn: false,
  },
  {
    key: 'insurance',
    name: 'ביטוח מבנה + חיים',
    description: 'נדרש לצורך משכנתא – שנה ראשונה',
    inputField: null,
    alwaysOn: true,
  },
  {
    key: 'registration',
    name: 'אגרות רישום (טאבו)',
    description: '~0.2% ממחיר הנכס',
    inputField: null,
    alwaysOn: true,
  },
  {
    key: 'renovation',
    name: 'חיץ שיפוצים',
    description: 'תקציב שיפוצים ראשוני',
    inputField: 'includeRenovationBuffer',
    alwaysOn: false,
  },
  {
    key: 'furnishing',
    name: 'ריהוט ראשוני',
    description: 'ריהוט ומכשירי חשמל בסיסיים',
    inputField: 'includeInitialFurnishing',
    alwaysOn: false,
  },
];

export function HiddenCostsChecklist({
  purchasePrice,
  onChange,
  className,
}: HiddenCostsChecklistProps) {
  const [input, setInput] = useState<SideCostsInput>(() =>
    getDefaultSideCostsInput(purchasePrice)
  );

  // Track which "always-on" items are toggled on in the UI
  const [alwaysOnToggles, setAlwaysOnToggles] = useState<Record<string, boolean>>({
    lawyer: true,
    insurance: true,
    registration: true,
  });

  // Recalculate when purchasePrice changes
  useEffect(() => {
    setInput((prev) => ({
      ...getDefaultSideCostsInput(purchasePrice),
      // Preserve user toggle state
      includeBroker: prev.includeBroker,
      includeAppraisal: prev.includeAppraisal,
      includeInspection: prev.includeInspection,
      includeInitialFurnishing: prev.includeInitialFurnishing,
      includeRenovationBuffer: prev.includeRenovationBuffer,
    }));
  }, [purchasePrice]);

  // Calculate costs from the module
  const result = calculateSideCosts(input);

  // Build a map from item name to SideCostItem for lookup
  const itemsByName = new Map<string, SideCostItem>();
  for (const item of result.items) {
    itemsByName.set(item.name, item);
  }

  // Match each checklist row to its calculated item
  const getAmountForRow = (row: ChecklistRow): number => {
    // The calculated items use Hebrew names matching those in side-costs.ts
    const nameMap: Record<string, string> = {
      lawyer: 'עורך דין',
      broker: 'תיווך',
      appraisal: 'שמאי מקרקעין',
      inspection: 'בדק בית (מהנדס)',
      insurance: 'ביטוח מבנה + חיים (שנה ראשונה)',
      registration: 'אגרות רישום (טאבו)',
      renovation: 'חיץ שיפוצים',
      furnishing: 'ריהוט ראשוני',
    };
    const calcName = nameMap[row.key];
    const item = itemsByName.get(calcName);
    return item ? item.amount : 0;
  };

  // Is a row currently enabled?
  const isRowEnabled = (row: ChecklistRow): boolean => {
    if (row.alwaysOn) {
      return alwaysOnToggles[row.key] ?? true;
    }
    if (row.inputField) {
      return input[row.inputField] as boolean;
    }
    return false;
  };

  // Calculate the visible total (respecting always-on toggles too)
  const visibleTotal = CHECKLIST_ROWS.reduce((sum, row) => {
    if (!isRowEnabled(row)) return sum;
    return sum + getAmountForRow(row);
  }, 0);

  // Build the visible items list for the onChange callback
  const getVisibleItems = useCallback((): SideCostItem[] => {
    return CHECKLIST_ROWS.filter((row) => isRowEnabled(row)).map((row) => ({
      name: row.name,
      amount: getAmountForRow(row),
      description: row.description,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, alwaysOnToggles, result]);

  // Notify parent on changes
  useEffect(() => {
    if (onChange) {
      const items = getVisibleItems();
      const total = items.reduce((sum, item) => sum + item.amount, 0);
      onChange(total, items);
    }
  }, [input, alwaysOnToggles, onChange, getVisibleItems]);

  // Handle toggle for togglable items
  const handleToggle = (row: ChecklistRow, checked: boolean) => {
    if (row.alwaysOn) {
      setAlwaysOnToggles((prev) => ({ ...prev, [row.key]: checked }));
    } else if (row.inputField) {
      setInput((prev) => ({ ...prev, [row.inputField!]: checked }));
    }
  };

  return (
    <Card className={cn('', className)} dir="rtl">
      <CardHeader>
        <CardTitle className="text-xl">
          עלויות נסתרות &ndash; מה באמת תשלם?
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          הפעל או כבה כל עלות כדי לראות את הסכום המעודכן
        </p>
      </CardHeader>
      <CardContent className="space-y-1">
        {CHECKLIST_ROWS.map((row) => {
          const enabled = isRowEnabled(row);
          const amount = getAmountForRow(row);

          return (
            <div
              key={row.key}
              className={cn(
                'flex items-center gap-4 rounded-lg px-4 py-3 transition-all duration-300',
                enabled
                  ? 'bg-accent/50'
                  : 'bg-transparent opacity-50'
              )}
            >
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => handleToggle(row, checked)}
                aria-label={`${enabled ? 'הסר' : 'הוסף'} ${row.name}`}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium transition-colors duration-300',
                    enabled ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {row.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {row.description}
                </p>
              </div>
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums whitespace-nowrap transition-all duration-300',
                  enabled ? 'text-foreground' : 'text-muted-foreground line-through'
                )}
              >
                {enabled ? formatCurrency(amount) : formatCurrency(amount)}
              </span>
            </div>
          );
        })}

        {/* Running total */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between px-4">
            <span className="text-base font-bold text-foreground">
              סה&quot;כ עלויות נלוות
            </span>
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: 'hsl(var(--chart-4))' }}
            >
              {formatCurrency(visibleTotal)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
