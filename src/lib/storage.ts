import { saveToCloud, logUsageEvent, type CloudEntry } from './cloud-storage';

const PREFIX = 'tool_';
// מפת חותמות זמן מקומיות לכל מפתח — משמשת למיזוג מול הענן
const META_KEY = 'tool__meta';

type MetaMap = Record<string, string>;

function readMeta(): MetaMap {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeMeta(meta: MetaMap): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch { /* quota exceeded */ }
}

function stampMeta(key: string, timestamp: string = new Date().toISOString()): void {
  const meta = readMeta();
  meta[key] = timestamp;
  writeMeta(meta);
}

export function save<T>(key: string, data: T, userId?: string): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data));
    stampMeta(key);
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
  const meta = readMeta();
  delete meta[key];
  writeMeta(meta);
  if (userId) {
    import('@/integrations/supabase/client').then(({ supabase }) => {
      supabase.from('user_data').delete().eq('user_id', userId).eq('tool_key', key).then(() => {});
    });
  }
}

export type MergeAction = 'push' | 'pull' | 'none';

// סבילות לסטיית שעונים בין מכשירים — הבדל קטן מזה נחשב "אותם נתונים"
const CLOCK_SKEW_TOLERANCE_MS = 30_000;

/**
 * הכרעת מיזוג לכל מפתח:
 * - קיים רק מקומית → push לענן
 * - קיים רק בענן → pull למקומי
 * - קיים בשניהם: המקומי חדש משמעותית → push; הענן חדש או שאין חותמת מקומית
 *   (מכשיר ישן — הנתונים כבר שוקפו לענן בעבר) → pull; אותו זמן בקירוב → none
 */
export function resolveMergeAction(params: {
  hasLocal: boolean;
  hasCloud: boolean;
  localUpdatedAt?: string;
  cloudUpdatedAt?: string;
}): MergeAction {
  const { hasLocal, hasCloud, localUpdatedAt, cloudUpdatedAt } = params;
  if (hasLocal && !hasCloud) return 'push';
  if (!hasLocal && hasCloud) return 'pull';
  if (!hasLocal && !hasCloud) return 'none';

  if (!localUpdatedAt) return 'pull'; // מכשיר מלפני מנגנון החותמות — הענן מנצח
  const localTime = Date.parse(localUpdatedAt);
  const cloudTime = cloudUpdatedAt ? Date.parse(cloudUpdatedAt) : 0;
  if (Number.isNaN(localTime)) return 'pull';

  if (localTime > cloudTime + CLOCK_SKEW_TOLERANCE_MS) return 'push';
  if (cloudTime > localTime + CLOCK_SKEW_TOLERANCE_MS) return 'pull';
  return 'none';
}

function listLocalKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX) && k !== META_KEY) {
      keys.push(k.slice(PREFIX.length));
    }
  }
  return keys;
}

/**
 * מיזוג דו-כיווני עם הענן בכניסה למערכת.
 * מחליף את הזוג syncToCloud→syncFromCloud הישן, שדרס נתונים חדשים בענן
 * בנתונים מקומיים ישנים ממכשיר אחר.
 */
export async function mergeWithCloud(userId: string): Promise<void> {
  const { loadAllFromCloudWithMeta, saveToCloud: pushToCloud } = await import('./cloud-storage');
  const cloudEntries: Record<string, CloudEntry> = await loadAllFromCloudWithMeta(userId);
  const meta = readMeta();
  const allKeys = new Set<string>([...listLocalKeys(), ...Object.keys(cloudEntries)]);

  for (const key of allKeys) {
    const localRaw = localStorage.getItem(PREFIX + key);
    const cloud = cloudEntries[key];
    const action = resolveMergeAction({
      hasLocal: localRaw !== null,
      hasCloud: cloud !== undefined,
      localUpdatedAt: meta[key],
      cloudUpdatedAt: cloud?.updatedAt,
    });

    if (action === 'push' && localRaw !== null) {
      try {
        await pushToCloud(userId, key, JSON.parse(localRaw));
      } catch { /* keep local; next save retries */ }
    } else if (action === 'pull' && cloud !== undefined) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(cloud.data));
        stampMeta(key, cloud.updatedAt);
      } catch { /* quota exceeded */ }
    }
  }
}
