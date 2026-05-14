import { saveToCloud, loadFromCloud, logUsageEvent } from './cloud-storage';

const PREFIX = 'tool_';

export function save<T>(key: string, data: T, userId?: string): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data));
  } catch { /* quota exceeded */ }

  if (userId) {
    saveToCloud(userId, key, data).catch(() => {});
    logUsageEvent(userId, key, 'save').catch(() => {});
  }
}

export function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clear(key: string, userId?: string): void {
  localStorage.removeItem(PREFIX + key);
  if (userId) {
    import('@/integrations/supabase/client').then(({ supabase }) => {
      supabase.from('user_data').delete().eq('user_id', userId).eq('tool_key', key).then(() => {});
    });
  }
}

export async function syncFromCloud(userId: string): Promise<void> {
  const { loadAllFromCloud } = await import('./cloud-storage');
  const cloudData = await loadAllFromCloud(userId);
  for (const [key, data] of Object.entries(cloudData)) {
    const localRaw = localStorage.getItem(PREFIX + key);
    if (!localRaw) {
      localStorage.setItem(PREFIX + key, JSON.stringify(data));
    }
  }
}

export async function syncToCloud(userId: string): Promise<void> {
  const { saveToCloud } = await import('./cloud-storage');
  const keys = ['budget', 'budget_results', 'business_plan', 'mortgage', 'mortgage_results'];
  for (const key of keys) {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw) {
      await saveToCloud(userId, key, JSON.parse(raw));
    }
  }
}
