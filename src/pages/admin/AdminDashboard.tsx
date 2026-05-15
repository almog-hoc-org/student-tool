import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  KeyRound,
  BarChart3,
  ArrowLeft,
  Inbox,
  Megaphone,
  AlertTriangle,
  Activity,
  Clock,
  Brain,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface Kpis {
  total_users: number;
  approved_users: number;
  pending_users: number;
  active_7d: number;
  inactive_14d: number;
  open_conversations: number;
  awaiting_human: number;
  avg_response_seconds: number | null;
}

interface ToolUsage {
  tool_key: string;
  count: number;
}

interface StuckUser {
  user_id: string;
  email: string;
  display_name: string | null;
  last_sign_in: string | null;
}

const TOOL_LABELS: Record<string, string> = {
  budget: 'תקציב',
  business_plan: 'תוכנית עסקית',
  mortgage: 'משכנתא',
  chat: 'צ׳אט AI',
};

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [toolUsage, setToolUsage] = useState<ToolUsage[]>([]);
  const [stuckUsers, setStuckUsers] = useState<StuckUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [kpiRes, eventsRes, usersRes] = await Promise.all([
        supabase.rpc('admin_dashboard_kpis'),
        supabase.from('usage_events').select('tool_key'),
        supabase.rpc('admin_list_users'),
      ]);

      if (kpiRes.data && kpiRes.data.length) {
        setKpis(kpiRes.data[0] as Kpis);
      }

      const events = (eventsRes.data ?? []) as { tool_key: string }[];
      const counts = new Map<string, number>();
      events.forEach((e) => {
        if (e.tool_key.endsWith('_results')) return;
        counts.set(e.tool_key, (counts.get(e.tool_key) ?? 0) + 1);
      });
      setToolUsage(
        Array.from(counts.entries()).map(([k, c]) => ({
          tool_key: TOOL_LABELS[k] ?? k,
          count: c,
        })),
      );

      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const all = (usersRes.data ?? []) as Array<{
        user_id: string;
        email: string;
        display_name: string | null;
        status: string;
        last_sign_in: string | null;
      }>;
      const stuck = all
        .filter((u) => u.status === 'approved')
        .filter((u) => {
          if (!u.last_sign_in) return true;
          return new Date(u.last_sign_in) < fourteenDaysAgo;
        })
        .slice(0, 5)
        .map((u) => ({
          user_id: u.user_id,
          email: u.email,
          display_name: u.display_name,
          last_sign_in: u.last_sign_in,
        }));
      setStuckUsers(stuck);

      setLoading(false);
    })();
  }, []);

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

      {/* Action shortcuts */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <ShortcutCard
          to="/admin/inbox"
          icon={Inbox}
          label="תיבת פניות"
          badge={kpis?.awaiting_human ?? 0}
          accent="amber"
        />
        <ShortcutCard
          to="/admin/broadcasts"
          icon={Megaphone}
          label="הודעות תפוצה"
        />
        <ShortcutCard to="/admin/users" icon={Users} label="משתמשים" />
        <ShortcutCard to="/admin/codes" icon={KeyRound} label="קודי הזמנה" />
        <ShortcutCard to="/admin/knowledge" icon={Brain} label="מוח הצ׳אט" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="פעילים השבוע"
          value={kpis?.active_7d ?? 0}
          icon={Activity}
          color="text-emerald-500"
        />
        <KpiCard
          label="לא פעילים 14d+"
          value={kpis?.inactive_14d ?? 0}
          icon={AlertTriangle}
          color="text-amber-500"
        />
        <KpiCard
          label="פניות פתוחות"
          value={kpis?.awaiting_human ?? 0}
          icon={Inbox}
          color="text-blue-500"
        />
        <KpiCard
          label="זמן תגובה ממוצע"
          value={fmtDuration(kpis?.avg_response_seconds ?? null)}
          icon={Clock}
          color="text-purple-500"
          isText
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="סה״כ" value={kpis?.total_users ?? 0} />
        <KpiCard
          label="מאושרים"
          value={kpis?.approved_users ?? 0}
          color="text-emerald-500"
        />
        <KpiCard
          label="ממתינים"
          value={kpis?.pending_users ?? 0}
          color="text-amber-500"
        />
        <KpiCard
          label="שיחות פתוחות"
          value={kpis?.open_conversations ?? 0}
        />
      </div>

      {/* Stuck users */}
      {stuckUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              תלמידים שכדאי לדחוף
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stuckUsers.map((u) => (
              <Link
                key={u.user_id}
                to="/admin/users"
                className="flex items-center justify-between p-2.5 rounded-lg border hover:border-primary/50"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {u.display_name || u.email}
                  </p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {u.email}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {u.last_sign_in
                    ? `נכנס: ${new Date(u.last_sign_in).toLocaleDateString('he-IL')}`
                    : 'לא נכנס מעולם'}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tool usage */}
      {toolUsage.length > 0 && (
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
                <BarChart data={toolUsage}>
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

      {loading && (
        <p className="text-center text-sm text-muted-foreground">טוען...</p>
      )}
    </div>
  );
}

function ShortcutCard({
  to,
  icon: Icon,
  label,
  badge,
  accent,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  accent?: 'amber';
}) {
  return (
    <Link to={to}>
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="p-3 flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{label}</p>
          </div>
          {badge !== undefined && badge > 0 && (
            <span
              className={
                accent === 'amber'
                  ? 'bg-amber-500 text-white text-xs rounded-full px-2 py-0.5'
                  : 'bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5'
              }
            >
              {badge}
            </span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  isText,
}: {
  label: string;
  value: number | string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  isText?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-3 text-center space-y-1">
        {Icon && <Icon className={`w-4 h-4 mx-auto ${color ?? ''}`} />}
        <p className={`${isText ? 'text-lg' : 'text-2xl'} font-bold ${color ?? ''}`}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function fmtDuration(seconds: number | null): string {
  if (!seconds || !Number.isFinite(seconds)) return '—';
  if (seconds < 3600) return `${Math.round(seconds / 60)}ד׳`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}ש׳`;
  return `${(seconds / 86400).toFixed(1)}ימ׳`;
}
