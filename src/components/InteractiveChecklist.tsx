import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checklist, ChecklistItem } from '@/lib/data/checklists';
import { useJourney } from '@/contexts/JourneyContext';
import { Link } from 'react-router-dom';
import { Check, ChevronLeft, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const STORAGE_PREFIX = 'checklist-';

function getCheckedItems(checklistId: string): Set<string> {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${checklistId}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function persistCheckedItems(checklistId: string, items: Set<string>) {
  localStorage.setItem(`${STORAGE_PREFIX}${checklistId}`, JSON.stringify([...items]));
}

interface InteractiveChecklistProps {
  checklist: Checklist;
}

export function InteractiveChecklist({ checklist }: InteractiveChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => getCheckedItems(checklist.id));
  const { getJourneyData } = useJourney();

  // Auto-check items that have autoKey and matching journey data
  useEffect(() => {
    let updated = false;
    const newChecked = new Set(checkedItems);
    for (const item of checklist.items) {
      if (item.autoKey && getJourneyData(item.autoKey as any) && !newChecked.has(item.id)) {
        newChecked.add(item.id);
        updated = true;
      }
    }
    if (updated) {
      setCheckedItems(newChecked);
      persistCheckedItems(checklist.id, newChecked);
    }
  }, [checklist.id, checklist.items, getJourneyData]);

  const toggleItem = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
    persistCheckedItems(checklist.id, newChecked);
  };

  const completedCount = checkedItems.size;
  const totalCount = checklist.items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">{checklist.title}</h3>
            <p className="text-xs text-muted-foreground">{checklist.description}</p>
          </div>
          <Badge variant={completedCount === totalCount ? 'default' : 'secondary'} className="text-xs">
            {completedCount}/{totalCount}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        {/* Items */}
        <div className="space-y-1">
          {checklist.items.map((item) => {
            const isChecked = checkedItems.has(item.id);
            const content = (
              <div
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-lg transition-colors duration-150 cursor-pointer',
                  isChecked ? 'bg-primary/5' : 'active:bg-muted/50'
                )}
                onClick={(e) => {
                  // Don't toggle if clicking the link arrow
                  if ((e.target as HTMLElement).closest('[data-link]')) return;
                  toggleItem(item.id);
                }}
              >
                {/* Checkbox */}
                <div className={cn(
                  'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-colors',
                  isChecked
                    ? 'bg-primary border-primary'
                    : 'border-border'
                )}>
                  {isChecked && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>

                {/* Label */}
                <span className={cn(
                  'text-sm flex-1',
                  isChecked && 'line-through text-muted-foreground'
                )}>
                  {item.label}
                </span>

                {/* Link arrow */}
                {item.link && (
                  <Link to={item.link} data-link className="flex-shrink-0 p-1">
                    <ChevronLeft className="w-4 h-4 text-primary" />
                  </Link>
                )}
              </div>
            );

            return <div key={item.id}>{content}</div>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}
