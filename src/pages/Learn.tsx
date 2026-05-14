import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, GraduationCap, Loader2, PlayCircle } from 'lucide-react';
import { listEnrolledCourses, type CourseWithProgress } from '@/lib/learn';
import { toast } from 'sonner';

export default function Learn() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    listEnrolledCourses(user.id)
      .then(setCourses)
      .catch(err => toast.error(err instanceof Error ? err.message : 'שגיאה בטעינת קורסים'))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="w-6 h-6" />
          הלימוד שלי
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          הקורסים שאתה רשום אליהם והתקדמותך בכל אחד.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          טוען...
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="font-semibold">עוד לא רשום לאף קורס</h2>
            <p className="text-sm text-muted-foreground">
              ברגע שהמנהלת תוסיף אותך לקבוצה, הקורס יופיע כאן.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map(({ course, totalLessons, completedLessons, inProgressLessons, lastActivity }) => {
            const pct = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
            return (
              <Card key={course.id} className="hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between gap-3">
                    <span>{course.title}</span>
                    <Badge variant="secondary">{pct}%</Badge>
                  </CardTitle>
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">{completedLessons} / {totalLessons} שיעורים</Badge>
                    {inProgressLessons > 0 && (
                      <Badge variant="outline">{inProgressLessons} בתהליך</Badge>
                    )}
                    {lastActivity && (
                      <Badge variant="outline">פעיל: {new Date(lastActivity).toLocaleDateString('he-IL')}</Badge>
                    )}
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <Link to={`/learn/${course.slug}`}>
                    <Button size="sm" className="w-full gap-2">
                      <PlayCircle className="w-4 h-4" />
                      המשך לימוד
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
