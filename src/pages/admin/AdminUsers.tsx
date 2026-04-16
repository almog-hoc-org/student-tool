import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, X, Shield, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type UserStatus = Database['public']['Enums']['user_status'];
type AppRole = Database['public']['Enums']['app_role'];

interface UserRow {
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  status: UserStatus;
  roles: AppRole[];
  created_at: string;
  last_sign_in: string | null;
}

const statusLabels: Record<UserStatus, string> = {
  pending: 'ממתין',
  approved: 'מאושר',
  rejected: 'נדחה',
};

const statusColors: Record<UserStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_list_users');
    if (error) {
      toast.error('שגיאה בטעינת משתמשים');
      console.error(error);
    } else {
      setUsers(data ?? []);
    }
    setLoading(false);
  }

  async function updateStatus(userId: string, status: UserStatus) {
    const { error } = await supabase.rpc('admin_update_user_status', {
      _user_id: userId,
      _status: status,
    });
    if (error) {
      toast.error('שגיאה בעדכון סטטוס');
    } else {
      toast.success('סטטוס עודכן');
      loadUsers();
    }
  }

  async function toggleAdmin(userId: string) {
    const { error } = await supabase.rpc('admin_toggle_role', {
      _user_id: userId,
      _role: 'admin' as AppRole,
    });
    if (error) {
      toast.error('שגיאה בעדכון הרשאות');
    } else {
      toast.success('הרשאות עודכנו');
      loadUsers();
    }
  }

  const filtered = users.filter(u =>
    (u.display_name ?? '').includes(search) ||
    u.email.includes(search)
  );

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ניהול משתמשים</h1>
        <Link to="/admin">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            חזרה
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="חיפוש לפי שם או אימייל..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">טוען...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">לא נמצאו משתמשים</p>
        ) : (
          filtered.map(user => (
            <Card key={user.user_id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold">{(user.display_name ?? user.email)?.[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{user.display_name || 'ללא שם'}</p>
                    <p className="text-xs text-muted-foreground truncate" dir="ltr">{user.email}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="secondary" className={statusColors[user.status]}>
                        {statusLabels[user.status]}
                      </Badge>
                      {user.roles.includes('admin') && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          מנהל
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {user.status !== 'approved' && (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(user.user_id, 'approved')} title="אשר">
                      <Check className="w-4 h-4 text-green-500" />
                    </Button>
                  )}
                  {user.status !== 'rejected' && (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(user.user_id, 'rejected')} title="דחה">
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => toggleAdmin(user.user_id)} title={user.roles.includes('admin') ? 'הסר מנהל' : 'הפוך למנהל'}>
                    <Shield className={`w-4 h-4 ${user.roles.includes('admin') ? 'text-purple-500' : 'text-muted-foreground'}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
