export interface SavedScenario {
  id: string;
  name: string;
  type: 'deal' | 'mortgage' | 'financial-checkup';
  inputs: Record<string, any>;
  results: Record<string, any>;
  notes: string;
  createdAt: number;
}

const STORAGE_KEY = 'saved-scenarios';
const MAX_SCENARIOS = 20;

function readScenarios(): SavedScenario[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as SavedScenario[];
  } catch {
    return [];
  }
}

function writeScenarios(scenarios: SavedScenario[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

export function saveScenario(
  scenario: Omit<SavedScenario, 'id' | 'createdAt'>
): SavedScenario {
  const scenarios = readScenarios();

  const newScenario: SavedScenario = {
    ...scenario,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  scenarios.unshift(newScenario);

  // Enforce the maximum number of stored scenarios
  const trimmed = scenarios.slice(0, MAX_SCENARIOS);
  writeScenarios(trimmed);

  return newScenario;
}

export function getScenarios(): SavedScenario[] {
  return readScenarios();
}

export function getScenariosByType(
  type: SavedScenario['type']
): SavedScenario[] {
  return readScenarios().filter((scenario) => scenario.type === type);
}

export function deleteScenario(id: string): void {
  const scenarios = readScenarios();
  const filtered = scenarios.filter((scenario) => scenario.id !== id);
  writeScenarios(filtered);
}

export function updateScenarioNotes(id: string, notes: string): void {
  const scenarios = readScenarios();
  const index = scenarios.findIndex((scenario) => scenario.id === id);

  if (index !== -1) {
    scenarios[index] = { ...scenarios[index], notes };
    writeScenarios(scenarios);
  }
}
