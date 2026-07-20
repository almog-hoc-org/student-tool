import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { toast } from 'sonner';

export default function Login() {
  const { user, loading, isApproved, signInWithEmail, signUp } = useAuth();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && isApproved) return <Navigate to="/" replace />;
  if (user) return <Navigate to="/pending" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signInWithEmail(loginEmail, loginPassword);
    setSubmitting(false);
    if (error) toast.error(error);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword.length < 6) {
      toast.error('סיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(regEmail, regPassword, regName);
    setSubmitting(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success('נרשמת בהצלחה! אשר את המייל שנשלח אליך — ומיד אחרי זה אפשר להיכנס.');
      // Notify admins of the pending signup (best-effort; verified server-side).
      supabase.functions
        .invoke('notify-email', {
          body: { kind: 'new_signup', email: regEmail, displayName: regName },
        })
        .catch((e) => console.warn('signup notify failed', e));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 bg-primary rounded-2xl flex items-center justify-center">
            <Logo className="w-9 h-9 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-display">הדרך לדירה</CardTitle>
          <p className="text-sm text-muted-foreground">המסע שלך לדירה הראשונה</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">כניסה</TabsTrigger>
              <TabsTrigger value="register">הרשמה</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">אימייל</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password">סיסמה</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  כניסה
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-name">שם מלא</Label>
                  <Input
                    id="reg-name"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email">אימייל</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-password">סיסמה</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    required
                    minLength={6}
                    dir="ltr"
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  הרשמה
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
