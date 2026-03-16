import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHero } from '@/components/PageHero';
import { Property } from '@/types/property';
import { getProperties, deleteProperty, saveProperty } from '@/lib/storage/property-storage';
import { formatCurrency } from '@/lib/validation/validators';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Plus,
  Trash2,
  Zap,
  ClipboardCheck,
  TrendingUp,
  ChevronLeft,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

const calcTypeIcons: Record<string, React.ReactNode> = {
  'quick-check': <Zap className="w-3.5 h-3.5" />,
  'property-visit': <ClipboardCheck className="w-3.5 h-3.5" />,
  'deal': <TrendingUp className="w-3.5 h-3.5" />,
};

const calcTypeLabels: Record<string, string> = {
  'quick-check': 'בדיקה מהירה',
  'property-visit': 'ביקור בנכס',
  'deal': 'תוכנית עסקית',
};

export default function MyProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    setProperties(getProperties());
  }, []);

  const handleAdd = () => {
    if (!newName.trim()) {
      toast({ title: 'שגיאה', description: 'יש להזין שם או כתובת', variant: 'destructive' });
      return;
    }
    saveProperty({
      name: newName.trim(),
      askingPrice: newPrice,
      notes: newNotes.trim(),
      linkedCalculations: [],
    });
    setProperties(getProperties());
    setNewName('');
    setNewPrice(0);
    setNewNotes('');
    setDialogOpen(false);
    toast({ title: 'הנכס נשמר בהצלחה' });
  };

  const handleDelete = (id: string) => {
    deleteProperty(id);
    setProperties(getProperties());
    toast({ title: 'הנכס נמחק' });
  };

  return (
    <div className="space-y-5 pb-8 max-w-2xl mx-auto">
      <PageHero
        icon={<MapPin className="w-6 h-6 text-primary" />}
        title="הנכסים שלי"
        description="עקוב אחרי נכסים שאתה בודק — שמור, השווה, וקבל החלטה"
      />

      {/* Add property button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full h-11 gap-2">
            <Plus className="w-4 h-4" />
            <span>הוסף נכס חדש</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוספת נכס חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>שם / כתובת</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="למשל: הרצל 12, תל אביב"
              />
            </div>
            <div className="space-y-2">
              <Label>מחיר מבוקש (₪)</Label>
              <Input
                type="number"
                value={newPrice || ''}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                placeholder="למשל 1,500,000"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label>הערות</Label>
              <Textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="הערות כלליות על הנכס..."
                rows={3}
              />
            </div>
            <Button onClick={handleAdd} className="w-full">
              שמור נכס
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Property list */}
      {properties.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              עוד לא שמרת נכסים. הוסף נכס ידנית או שמור מתוך בדיקה מהירה.
            </p>
          </CardContent>
        </Card>
      )}

      <AnimatePresence>
        {properties.map((property, index) => (
          <motion.div
            key={property.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{property.name}</h3>
                    {property.askingPrice > 0 && (
                      <p className="text-lg font-bold text-primary mt-0.5">
                        {formatCurrency(property.askingPrice)}
                      </p>
                    )}
                    {property.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {property.notes}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      נשמר {new Date(property.createdAt).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                    onClick={() => handleDelete(property.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Linked calculations */}
                {property.linkedCalculations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
                    {property.linkedCalculations.map((calc, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 text-[10px] py-0.5">
                        {calcTypeIcons[calc.type]}
                        {calcTypeLabels[calc.type]}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Quick actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Link to={`/quick-check`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1 h-8">
                      <Zap className="w-3.5 h-3.5" />
                      בדיקה מהירה
                    </Button>
                  </Link>
                  <Link to={`/property-visit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1 h-8">
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      ביקור בנכס
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
