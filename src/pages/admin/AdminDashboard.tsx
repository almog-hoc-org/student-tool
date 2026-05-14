import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, KeyRound, BarChart3, ArrowLeft, LifeBuoy, BookOpen, Users2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface Stats {
  totalUsers: number;
  approved: number;
  pending: number;
  rejected: number;
  toolUsage: { tool_key: string; count: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const [profilesRes, eventsRes] = await Promise.all([
      supabase.from('profiles').select('status'),
      supabase.from('usage_events').select('tool_key'),
    ]);

    const profiles = profilesRes.data ?? [];
    const events = eventsRes.data ?? [];

    const toolMap = new Map<string, number>();
    events.forEach(e => toolMap.set(e.tool_key, (toolMap.get(e.tool_key) ?? 0) + 1));

    const toolLabels: Record<string, string> = {
      budget: 'תקציב',
      budget_results: 'תקציב (תוצאות)',
      business_plan: 'תוכנית עסקית',
      mortgage: 'משכנתא',
      mortgage_results: 'משכנתא (תוצאות)',
    };

    setStats({
      totalUsers: profiles.length,
      approved: profiles.filter(p => p.status === 'approved').length,
      pending: profiles.filter(p => p.status === 'pending').length,
      rejected: profiles.filter(p => p.status === 'rejected').length,
      toolUsage: Array.from(toolMap.entries())
        .filter(([key]) => !key.endsWith('_results'))
        .map(([tool_key, count]) => ({ tool_key: toolLabels[tool_key] ?? tool_key, count })),
    });
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">לוח בקרה</h1>
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            חזרה
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link to="/admin/users">
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="w-4 h-4" />
            תלמידים
          </Button>
        </Link>
        <Link to="/admin/cohorts">
          <Button variant="outline" size="sm" className="gap-2">
            <Users2 className="w-4 h-4" />
            קבוצות
          </Button>
        </Link>
        <Link to="/admin/codes">
          <Button variant="outline" size="sm" className="gap-2">
            <KeyRound className="w-4 h-4" />
            קודי הזמנה
          </Button>
        </Link>
        <Link to="/admin/content">
          <Button variant="outline" size="sm" className="gap-2">
            <BookOpen className="w-4 h-4" />
            תוכן קורס
          </Button>
        </Link>
        <Link to="/admin/support">
          <Button variant="outline" size="sm" className="gap-2">
            <LifeBuoy className="w-4 h-4" />
            תמיכה
          </Button>
        </Link>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
                <p className="text-sm text-muted-foreground">סה״כ משתמשים</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-500">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">מאושרים</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-amber-500">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">ממתינים</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-red-500">{stats.rejected}</p>
                <p className="text-sm text-muted-foreground">נדחו</p>
              </CardContent>
            </Card>
          </div>

          {stats.toolUsage.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  שימוש בכלים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.toolUsage}>
                      <XAxis dataKey="tool_key" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
