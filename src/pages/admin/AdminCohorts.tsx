// Phase 5 will flesh this out with cohort management (group by invite-code
// cohort, bulk-send notifications, view aggregate progress).
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function AdminCohorts() {
  return (
    <div className="space-y-4" dir="rtl">
      <Link to="/admin">
        <Button variant="ghost" size="sm" className="gap-1">
          <ArrowRight className="w-4 h-4" />
          חזרה
        </Button>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>קבוצות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>בשלב 5 נבנה כאן את ניהול ה-cohorts: קיבוץ תלמידים לפי invite code, צפייה
          באגרגציה של התקדמות, ושליחה bulk של הודעות.</p>
        </CardContent>
      </Card>
    </div>
  );
}
