import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { syncOnLogin, syncToCloud, clearAllLocal, flushPendingSaves } from '@/lib/storage';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type UserStatus = Database['public']['Enums']['user_status'];

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  onboarded_at: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isAdmin: boolean;
  isApproved: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  // רשימת עמודות מפורשת — בלי admin_notes, שהן הערות פנימיות של הצוות
  const { data } = await supabase
    .from('profiles')
    .select('id, user_id, display_name, avatar_url, status, created_at, updated_at, onboarded_at')
    .eq('user_id', userId)
    .single();
  return data;
}

async function fetchRoles(userId: string): Promise<AppRole[]> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  return data?.map(r => r.role) ?? [];
}

/**
 * Idempotent: stamp `schema_version: 1` on any user_data row that doesn't yet
 * carry one. Future schema changes can gate on this marker.
 */
async function migrateSchemaVersions(userId: string): Promise<void> {
  try {
    const { data } = await supabase
      .from('user_data')
      .select('tool_key, data')
      .eq('user_id', userId);
    if (!data) return;
    const targets = data.filter((row) => {
      const d = row.data as Record<string, unknown> | null;
      return d && typeof d === 'object' && d.schema_version === undefined;
    });
    if (!targets.length) return;
    await Promise.all(
      targets.map((row) =>
        supabase
          .from('user_data')
          .update({
            data: { ...(row.data as object), schema_version: 1 } as never,
          })
          .eq('user_id', userId)
          .eq('tool_key', row.tool_key),
      ),
    );
  } catch (e) {
    console.warn('schema_version migration skipped', e);
  }
}

// עקיפת auth לצילומי מסך/E2E בפיתוח בלבד: import.meta.env.DEV הוא false
// סטטי ב-production build, כך שהקוד הזה נמחק לגמרי מהבאנדל האמיתי.
const E2E_BYPASS = import.meta.env.DEV && import.meta.env.VITE_E2E === '1';

const E2E_PROFILE: Profile = {
  id: 'e2e-profile',
  user_id: 'e2e-user',
  display_name: 'תלמיד בדיקה',
  avatar_url: null,
  status: 'approved' as UserStatus,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  onboarded_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  // מזהה המשתמש שכבר סונכרן — מונע ריצה כפולה של הסנכרון
  // (getSession ו-INITIAL_SESSION יורים שניהם בעלייה)
  const syncedForUser = useRef<string | null>(null);

  const loadUserData = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setRoles([]);
      return;
    }
    const [p, r] = await Promise.all([
      fetchProfile(currentUser.id),
      fetchRoles(currentUser.id),
    ]);
    setProfile(p);
    setRoles(r);
    if (syncedForUser.current !== currentUser.id) {
      syncedForUser.current = currentUser.id;
      // סנכרון דו-כיווני לפי זמן עדכון — "החדש מנצח"
      syncOnLogin(currentUser.id)
        .then(() => migrateSchemaVersions(currentUser.id))
        .catch(() => { syncedForUser.current = null; });
    }
  };

  useEffect(() => {
    if (E2E_BYPASS) {
      setUser({ id: 'e2e-user', email: 'e2e@test.local' } as User);
      setProfile(E2E_PROFILE);
      setRoles(['student' as AppRole]);
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      loadUserData(s?.user ?? null).finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      loadUserData(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // סגירת טאב/מעבר אפליקציה — ניקוז כתיבות ענן שממתינות בדיבאונס
  useEffect(() => {
    if (!user) return;
    const onPageHide = () => flushPendingSaves(user.id);
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [user]);

  // סנכרון חוזר בחזרה לטאב / חזרת רשת — קודם רק פעם אחת בהתחברות,
  // ושני מכשירים פתוחים התבדרו לכל אורך הסשן. מוגבל לפעם בדקה.
  const lastResync = useRef(0);
  useEffect(() => {
    if (!user) return;
    const resync = () => {
      const now = Date.now();
      if (now - lastResync.current < 60_000) return;
      lastResync.current = now;
      syncOnLogin(user.id).catch(() => {});
    };
    window.addEventListener('focus', resync);
    window.addEventListener('online', resync);
    return () => {
      window.removeEventListener('focus', resync);
      window.removeEventListener('online', resync);
    };
  }, [user]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // After the user confirms their email, return them to the app so the
        // session is picked up and ProtectedRoute routes them to /pending
        // (instead of landing on the stale Site URL / an error page).
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: displayName,
        },
      },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    // דחיפה אחרונה לענן ואז ניקוי מקומי מלא — משתמש אחר באותו דפדפן
    // לא יראה (או ידרוס) את הנתונים הפיננסיים של המשתמש הקודם
    if (user) {
      flushPendingSaves(user.id);
      let synced = false;
      try { synced = await syncToCloud(user.id); } catch { /* offline */ }
      if (!synced) {
        const proceed = window.confirm(
          'הסנכרון לענן נכשל (אין חיבור?). התנתקות עכשיו תמחק שינויים מקומיים שטרם נשמרו. להתנתק בכל זאת?',
        );
        if (!proceed) return;
      }
    }
    clearAllLocal();
    syncedForUser.current = null;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const refreshProfile = async () => {
    if (user) await loadUserData(user);
  };

  const isAdmin = roles.includes('admin');
  const isApproved = profile?.status === 'approved';

  return (
    <AuthContext.Provider value={{
      user, session, profile, roles, isAdmin, isApproved, loading,
      signInWithGoogle, signInWithEmail, signUp, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
