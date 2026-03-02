import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalculationHistory, getCalculationHistory } from '@/lib/storage/calculator-history';
import { X, ArrowLeftRight, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/validation/validators';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ComparisonViewProps {
  items: CalculationHistory[];
  onClose: () => void;
}

function flattenInput(input: any): Record<string, string> {
  if (!input) return {};
  const flat: Record<string, string> = {};

  const walk = (obj: any, prefix = '') => {
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => walk(item, `${prefix}[${i}]`));
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([k, v]) => walk(v, prefix ? `${prefix}.${k}` : k));
    } else {
      flat[prefix] = String(obj);
    }
  };

  walk(input);
  return flat;
}

export function ComparisonView({ items, onClose }: ComparisonViewProps) {
  if (items.length < 2) return null;

  // Collect all unique parameter keys
  const allKeys = new Set<string>();
  const flatInputs = items.map(item => {
    const flat = flattenInput(item.input);
    Object.keys(flat).forEach(k => allKeys.add(k));
    return flat;
  });
  const keys = Array.from(allKeys);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl max-h-[85vh] overflow-auto"
        >
          <Card className="border border-border/60 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-primary/8 rounded-lg flex items-center justify-center">
                    <ArrowLeftRight className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">השוואת חישובים</CardTitle>
                    <CardDescription className="text-xs">{items.length} תרחישים זה לצד זה</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <Card className="border border-border/60 h-full">
                      <CardContent className="p-4">
                        <Badge variant="outline" className="mb-2 text-[10px]">תרחיש #{index + 1}</Badge>
                        <p className="font-medium text-sm mb-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(item.timestamp).toLocaleDateString('he-IL')}
                        </p>
                        <div className="p-2.5 bg-primary/5 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-0.5">תוצאה</p>
                          <p className="text-base font-bold">{item.result}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Detailed Comparison Table */}
              {keys.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[140px]">פרמטר</TableHead>
                        {items.map((item, i) => (
                          <TableHead key={item.id} className="text-left min-w-[120px]">
                            תרחיש #{i + 1}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keys.map(key => {
                        const values = flatInputs.map(f => f[key] || '–');
                        const allSame = values.every(v => v === values[0]);
                        return (
                          <TableRow key={key} className={!allSame ? 'bg-accent/5' : ''}>
                            <TableCell className="text-xs font-medium">{key}</TableCell>
                            {values.map((val, i) => (
                              <TableCell key={i} className={`text-xs ${!allSame ? 'font-semibold text-primary' : ''}`}>
                                {val}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
