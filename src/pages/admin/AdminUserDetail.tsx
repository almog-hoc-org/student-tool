// Phase 5 will flesh this out with full per-student deep view (profile,
// progress, tickets, activity log, admin notes, manual push).
// For now we render a placeholder so the route resolves.
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function AdminUserDetail() {
  const { userId } = useParams();
  return (
    <div className="space-y-4" dir="rtl">
      <Link to="/admin/users">
        <Button variant="ghost" size="sm" className="gap-1">
          <ArrowRight className="w-4 h-4" />
          חזרה לרשימה
        </Button>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>תלמיד {userId}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>הדף הזה ייבנה במלואו בשלב 5 של תוכנית השדרוג:</p>
          <ul className="list-disc pr-5 space-y-1">
            <li>פרופיל מלא + תאריך הרשמה + cohort</li>
            <li>התקדמות לפי קורס/מודול/שיעור</li>
            <li>פניות תמיכה פתוחות וסגורות של התלמיד</li>
            <li>היסטוריית פעילות מ-student_activity</li>
            <li>הערות מנהלת חופשיות</li>
            <li>כפתור "שלח דחיפה" — אימייל + in-app notification מתבנית</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
