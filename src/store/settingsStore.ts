import { Settings } from '../types';

const STORAGE_KEY = 'printcost_pro_settings';

const DEFAULT_SETTINGS: Settings = {
  toner: {
    c: { price: 150, yield: 50000 },
    m: { price: 150, yield: 50000 },
    y: { price: 150, yield: 50000 },
    k: { price: 100, yield: 80000 },
  },
  wear: {
    drum: 0.01,
    fuser: 0.005,
    belt: 0.003,
    other: 0.002,
  },
  labor: {
    hourlyRate: 35,
    overhead: 10,
  },
  papers: [
    { id: '1', name: 'SRA3 300g Patinata Opaca', costPerSheet: 0.18, width: 320, height: 450, weight: 300 },
    { id: '2', name: 'A3 80g Offset', costPerSheet: 0.05, width: 297, height: 420, weight: 80 },
  ],
};

export function getSettings(): Settings {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse settings', e);
    }
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
