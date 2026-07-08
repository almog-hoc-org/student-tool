import { describe, it, expect, vi, beforeEach } from 'vitest';

// מחליפים את שכבת הענן כדי לא לטעון את לקוח Supabase בסביבת node
vi.mock('../cloud-storage', () => ({
  saveToCloud: vi.fn(async () => {}),
  logUsageEvent: vi.fn(async () => {}),
  loadAllFromCloudWithMeta: vi.fn(async () => ({})),
}));

import { resolveMergeAction, mergeWithCloud, save, load } from '../storage';
import { saveToCloud, loadAllFromCloudWithMeta } from '../cloud-storage';

// localStorage מדומה לסביבת node
function installFakeLocalStorage() {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  } as Storage;
}

const OLD = '2026-01-01T00:00:00.000Z';
const NEW = '2026-06-01T00:00:00.000Z';

describe('resolveMergeAction — חמשת ענפי ההכרעה', () => {
  it('קיים רק מקומית → push', () => {
    expect(resolveMergeAction({ hasLocal: true, hasCloud: false })).toBe('push');
  });

  it('קיים רק בענן → pull', () => {
    expect(resolveMergeAction({ hasLocal: false, hasCloud: true, cloudUpdatedAt: NEW })).toBe('pull');
  });

  it('המקומי חדש משמעותית → push (עריכה במצב לא מקוון)', () => {
    expect(resolveMergeAction({
      hasLocal: true, hasCloud: true, localUpdatedAt: NEW, cloudUpdatedAt: OLD,
    })).toBe('push');
  });

  it('הענן חדש משמעותית → pull (מכשיר אחר שמר אחרי)', () => {
    expect(resolveMergeAction({
      hasLocal: true, hasCloud: true, localUpdatedAt: OLD, cloudUpdatedAt: NEW,
    })).toBe('pull');
  });

  it('אין חותמת מקומית (מכשיר מלפני המנגנון) → pull, הענן מנצח', () => {
    expect(resolveMergeAction({
      hasLocal: true, hasCloud: true, cloudUpdatedAt: OLD,
    })).toBe('pull');
  });

  it('אותו זמן בקירוב (בתוך סבילות הסטייה) → none', () => {
    expect(resolveMergeAction({
      hasLocal: true, hasCloud: true,
      localUpdatedAt: '2026-06-01T00:00:10.000Z',
      cloudUpdatedAt: '2026-06-01T00:00:00.000Z',
    })).toBe('none');
  });
});

describe('mergeWithCloud — אינטגרציה מול ענן מדומה', () => {
  beforeEach(() => {
    installFakeLocalStorage();
    vi.clearAllMocks();
  });

  it('נתון חדש בענן דורס נתון מקומי ישן (התיקון המרכזי)', async () => {
    // מכשיר A: נתון מקומי ישן
    localStorage.setItem('tool_budget', JSON.stringify({ equity: 100 }));
    localStorage.setItem('tool__meta', JSON.stringify({ budget: OLD }));
    // הענן: נתון חדש ממכשיר B
    vi.mocked(loadAllFromCloudWithMeta).mockResolvedValue({
      budget: { data: { equity: 999 }, updatedAt: NEW },
    });

    await mergeWithCloud('user-1');

    expect(load<{ equity: number }>('budget')).toEqual({ equity: 999 });
    expect(saveToCloud).not.toHaveBeenCalled();
  });

  it('עריכה מקומית לא מקוונת חדשה נדחפת לענן', async () => {
    localStorage.setItem('tool_budget', JSON.stringify({ equity: 555 }));
    localStorage.setItem('tool__meta', JSON.stringify({ budget: NEW }));
    vi.mocked(loadAllFromCloudWithMeta).mockResolvedValue({
      budget: { data: { equity: 100 }, updatedAt: OLD },
    });

    await mergeWithCloud('user-1');

    expect(saveToCloud).toHaveBeenCalledWith('user-1', 'budget', { equity: 555 });
    expect(load<{ equity: number }>('budget')).toEqual({ equity: 555 });
  });

  it('מפתח שקיים רק מקומית נדחף — כולל מפתחות שלא היו ברשימה הישנה', async () => {
    localStorage.setItem('tool_property_check', JSON.stringify({ price: 1 }));
    localStorage.setItem('tool__meta', JSON.stringify({ property_check: NEW }));
    vi.mocked(loadAllFromCloudWithMeta).mockResolvedValue({});

    await mergeWithCloud('user-1');

    expect(saveToCloud).toHaveBeenCalledWith('user-1', 'property_check', { price: 1 });
  });

  it('מפתח שקיים רק בענן נמשך למקומי', async () => {
    vi.mocked(loadAllFromCloudWithMeta).mockResolvedValue({
      mortgage: { data: { tracks: [] }, updatedAt: NEW },
    });

    await mergeWithCloud('user-1');

    expect(load('mortgage')).toEqual({ tracks: [] });
  });

  it('save() חותם זמן במפה כך שהמיזוג הבא יזהה את המקומי כחדש', () => {
    save('budget', { equity: 42 });
    const meta = JSON.parse(localStorage.getItem('tool__meta')!);
    expect(typeof meta.budget).toBe('string');
    expect(Number.isNaN(Date.parse(meta.budget))).toBe(false);
  });
});
