import { saveToCloud, logUsageEvent } from './cloud-storage';

const PREFIX = 'tool_';
// מפת זמני עדכון מקומיים — משמשת לסנכרון דו-כיווני לפי "החדש מנצח"
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

/** כל מפתחות הכלים השמורים מקומית (בלי מפת המטא). */
function localToolKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX) && k !== META_KEY) keys.push(k.slice(PREFIX.length));
  }
  return keys;
}

export function save<T>(key: string, data: T, userId?: string): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data));
    const meta = readMeta();
    meta[key] = new Date().toISOString();
    writeMeta(meta);
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

/**
 * ניקוי כל נתוני הכלים המקומיים — נקרא בהתנתקות כדי שמשתמש אחר
 * באותו דפדפן לא יראה (או ידרוס בענן) נתונים פיננסיים של קודמו.
 */
export function clearAllLocal(): void {
  for (const key of localToolKeys()) {
    localStorage.removeItem(PREFIX + key);
  }
  localStorage.removeItem(META_KEY);
}

/** העלאת כל הנתונים המקומיים לענן (למשל לפני התנתקות). */
export async function syncToCloud(userId: string): Promise<void> {
  for (const key of localToolKeys()) {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw) {
      try {
        await saveToCloud(userId, key, JSON.parse(raw));
      } catch { /* offline — הנתונים המקומיים נשארים */ }
    }
  }
}

/**
 * סנכרון בהתחברות — דו-כיווני לפי זמן עדכון ("החדש מנצח"):
 * - מפתח שקיים רק בצד אחד — מועתק לצד השני.
 * - קיים בשניהם — הגרסה עם חותמת הזמן המאוחרת מנצחת.
 * - נתון מקומי ישן ללא חותמת (מלפני השדרוג) — הענן מנצח.
 * מחליף את המנגנון הישן שדרס ענן עדכני בנתונים מקומיים ישנים.
 */
export async function syncOnLogin(userId: string): Promise<void> {
  const { loadAllFromCloudWithMeta } = await import('./cloud-storage');
  const cloud = await loadAllFromCloudWithMeta(userId);
  const meta = readMeta();

  // משיכה: ענן → מקומי כשהענן חדש יותר (או שאין מקומי)
  for (const [key, row] of Object.entries(cloud)) {
    const localRaw = localStorage.getItem(PREFIX + key);
    const localTime = meta[key];
    const cloudNewer = !localTime || new Date(row.updated_at) > new Date(localTime);
    if (!localRaw || cloudNewer) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(row.data));
        meta[key] = row.updated_at;
      } catch { /* quota exceeded */ }
    }
  }
  writeMeta(meta);

  // דחיפה: מקומי → ענן כשהמקומי חדש יותר (או שאין בענן)
  for (const key of localToolKeys()) {
    const cloudRow = cloud[key];
    const localTime = meta[key];
    const localNewer = cloudRow && localTime && new Date(localTime) > new Date(cloudRow.updated_at);
    if (!cloudRow || localNewer) {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw) {
        try {
          await saveToCloud(userId, key, JSON.parse(raw));
        } catch { /* offline */ }
      }
    }
  }
}
