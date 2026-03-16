import { Property, LinkedCalculation } from '@/types/property';

const STORAGE_KEY = 'saved-properties';
const MAX_PROPERTIES = 10;

export function getProperties(): Property[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      linkedCalculations: (item.linkedCalculations || []).map((lc: any) => ({
        ...lc,
        timestamp: new Date(lc.timestamp),
      })),
    }));
  } catch {
    return [];
  }
}

export function saveProperty(property: Omit<Property, 'id' | 'createdAt'>): Property {
  const stored = getProperties();
  const newItem: Property = {
    ...property,
    id: crypto.randomUUID(),
    createdAt: new Date(),
  };
  stored.unshift(newItem);
  const trimmed = stored.slice(0, MAX_PROPERTIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return newItem;
}

export function updateProperty(id: string, updates: Partial<Omit<Property, 'id' | 'createdAt'>>): void {
  const stored = getProperties();
  const index = stored.findIndex(p => p.id === id);
  if (index === -1) return;
  stored[index] = { ...stored[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function addLinkedCalculation(propertyId: string, calc: Omit<LinkedCalculation, 'timestamp'>): void {
  const stored = getProperties();
  const property = stored.find(p => p.id === propertyId);
  if (!property) return;
  property.linkedCalculations.push({ ...calc, timestamp: new Date() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function deleteProperty(id: string): void {
  const stored = getProperties();
  const filtered = stored.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
