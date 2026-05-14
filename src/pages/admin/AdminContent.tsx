// Phase 5 / Phase 2 follow-up: full course/module/lesson editor.
// For initial setup, content is bootstrapped via scripts/import-syllabus.ts
// or directly via the Supabase dashboard.
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function AdminContent() {
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
          <CardTitle>ניהול תוכן קורס</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>עורך התוכן ייבנה כאן: יצירה ועריכה של courses, modules, lessons.</p>
          <p className="font-medium text-foreground">בינתיים, להוספת תוכן ראשוני:</p>
          <ol className="list-decimal pr-5 space-y-1">
            <li>הכן syllabus JSON לפי הסכמה ב-<code className="bg-muted px-1">scripts/import-syllabus.ts</code></li>
            <li>הרץ <code className="bg-muted px-1">npx tsx scripts/import-syllabus.ts ./syllabus.json</code></li>
            <li>ערוך body_md/video_url ידנית דרך Supabase Studio</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
