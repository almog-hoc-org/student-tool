import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogOut, Loader2 } from 'lucide-react';

export default function PendingApproval() {
  const { user, profile, loading, isApproved, signOut, refreshProfile } = useAuth();

  useEffect(() => {
    if (!user || isApproved) return;
    const interval = setInterval(refreshProfile, 30000);
    return () => clearInterval(interval);
  }, [user, isApproved, refreshProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (isApproved) return <Navigate to="/" replace />;

  const isRejected = profile?.status === 'rejected';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-3">
          <div className="mx-auto w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center">
            <Clock className="w-7 h-7 text-amber-500" />
          </div>
          <CardTitle>{isRejected ? 'הגישה נדחתה' : 'ממתין לאישור'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isRejected ? (
            <p className="text-muted-foreground">
              הבקשה שלך לגישה למערכת נדחתה. אם אתה חושב שמדובר בטעות, פנה למנהל.
            </p>
          ) : (
            <>
              <p className="text-muted-foreground">
                הרשמתך התקבלה ומחכה לאישור מנהל המערכת.
              </p>
              <p className="text-sm text-muted-foreground">
                תקבל גישה ברגע שהמנהל יאשר את החשבון שלך.
              </p>
            </>
          )}
          <Button variant="outline" className="gap-2" onClick={signOut}>
            <LogOut className="w-4 h-4" />
            התנתק
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
