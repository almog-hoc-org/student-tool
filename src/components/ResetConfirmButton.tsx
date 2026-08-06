import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

/**
 * כפתור איפוס עם דיאלוג אישור מעוצב (RTL) — מחליף את window.confirm
 * הדפדפני שהיה לא עקבי עם שאר המערכת והציג טקסט לא מדויק.
 */
export function ResetConfirmButton({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground h-8 gap-1">
          <RotateCcw className="w-3.5 h-3.5" /> אפס
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>לאפס את המחשבון?</AlertDialogTitle>
          <AlertDialogDescription>
            הנתונים שהזנת יימחקו והמחשבון יחזור לנתוני הדוגמה. תרחישים ששמרת לא נמחקים.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>אפס</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
