import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type Theme = 'light' | 'dark';

const db = supabase as unknown as {
  from: (t: string) => ReturnType<typeof supabase.from>;
};

async function persistTheme(userId: string, theme: Theme) {
  try {
    await db
      .from('profiles')
      .update({ theme })
      .eq('user_id', userId);
  } catch (e) {
    // localStorage still saved the value — silent.
    console.warn('theme persist failed', e);
  }
}

async function loadStoredTheme(userId?: string): Promise<Theme> {
  if (userId) {
    try {
      const { data } = await db
        .from('profiles')
        .select('theme')
        .eq('user_id', userId)
        .maybeSingle();
      const remote = (data as { theme?: Theme | null } | null)?.theme;
      if (remote === 'light' || remote === 'dark') return remote;
    } catch {
      /* fall through to localStorage */
    }
  }
  const saved = localStorage.getItem('theme') as Theme | null;
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function ThemeToggle() {
  const { user } = useAuth();
  // הסקריפט ב-index.html כבר החיל את המצב על ה-DOM לפני הציור הראשון
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  );

  useEffect(() => {
    let cancelled = false;
    loadStoredTheme(user?.id).then((t) => {
      if (cancelled) return;
      setTheme(t);
      document.documentElement.classList.toggle('dark', t === 'dark');
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    if (user?.id) void persistTheme(user.id, newTheme);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full"
      aria-label={theme === 'dark' ? 'עבור למצב יום' : 'עבור למצב לילה'}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-primary" />
      )}
    </Button>
  );
}
