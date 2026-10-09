import { Medication, IntakeLog, AppSettings } from '../types';

const STORAGE_KEY_MEDS = 'smart_med_medications_v1';
const STORAGE_KEY_LOGS = 'smart_med_logs_v1';
const STORAGE_KEY_SETTINGS = 'smart_med_settings_v1';

export const DEFAULT_GAS_URL =
  'https://script.google.com/macros/s/AKfycbxiyZvirJeN4u9BJfAvQMNOiOlCh4r7RZ5argx9ye-lYGVtP1ZnOov3pMTOpcg29bvq/exec';

const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: 'med-1',
    name: '비타민 D (1000 IU)',
    time: '08:30',
    dosage: '1캡슐',
    memo: '아침 식후 30분, 충분한 물과 함께 복용',
    category: 'supplement',
    color: 'amber',
    stock: 24,
    refillThreshold: 7,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-2',
    name: '혈압약 (암로디핀 5mg)',
    time: '09:00',
    dosage: '1정',
    memo: '매일 아침 일정한 시간에 복용',
    category: 'chronic',
    color: 'rose',
    stock: 18,
    refillThreshold: 5,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-3',
    name: '프로바이오틱스 유산균',
    time: '07:30',
    dosage: '1포',
    memo: '기상 직후 아침 공복에 미온수와 복용',
    category: 'supplement',
    color: 'blue',
    stock: 30,
    refillThreshold: 6,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-4',
    name: '오메가-3 (EPA/DHA)',
    time: '19:30',
    dosage: '2캡슐',
    memo: '저녁 식사 직후 복용 (흡수율 증대)',
    category: 'supplement',
    color: 'emerald',
    stock: 45,
    refillThreshold: 10,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  userName: '복약자',
  enableAudio: true,
  enableSpeech: true,
  enableDesktopNotification: true,
  gasUrl: DEFAULT_GAS_URL,
  syncToGas: false,
  snoozeMinutes: 10,
};

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPastDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateInitialLogs(): IntakeLog[] {
  const logs: IntakeLog[] = [];
  // Generate sample logs for past 6 days
  for (let i = 6; i >= 1; i--) {
    const date = getPastDateString(i);
    // med 1
    logs.push({
      id: `log-seed-${i}-1`,
      medicationId: 'med-1',
      medicationName: '비타민 D (1000 IU)',
      dosage: '1캡슐',
      category: 'supplement',
      scheduledTime: '08:30',
      takenTime: '08:35',
      date,
      status: 'taken',
    });
    // med 2
    logs.push({
      id: `log-seed-${i}-2`,
      medicationId: 'med-2',
      medicationName: '혈압약 (암로디핀 5mg)',
      dosage: '1정',
      category: 'chronic',
      scheduledTime: '09:00',
      takenTime: '09:02',
      date,
      status: 'taken',
    });
    // med 3
    if (i !== 3) {
      logs.push({
        id: `log-seed-${i}-3`,
        medicationId: 'med-3',
        medicationName: '프로바이오틱스 유산균',
        dosage: '1포',
        category: 'supplement',
        scheduledTime: '07:30',
        takenTime: '07:40',
        date,
        status: 'taken',
      });
    } else {
      logs.push({
        id: `log-seed-${i}-3`,
        medicationId: 'med-3',
        medicationName: '프로바이오틱스 유산균',
        dosage: '1포',
        category: 'supplement',
        scheduledTime: '07:30',
        takenTime: '',
        date,
        status: 'skipped',
        note: '출장 일정으로 건너뜀',
      });
    }
    // med 4
    logs.push({
      id: `log-seed-${i}-4`,
      medicationId: 'med-4',
      medicationName: '오메가-3 (EPA/DHA)',
      dosage: '2캡슐',
      category: 'supplement',
      scheduledTime: '19:30',
      takenTime: '19:45',
      date,
      status: 'taken',
    });
  }

  // Today initial log (early morning med taken)
  const today = getTodayDateString();
  logs.push({
    id: `log-today-1`,
    medicationId: 'med-3',
    medicationName: '프로바이오틱스 유산균',
    dosage: '1포',
    category: 'supplement',
    scheduledTime: '07:30',
    takenTime: '07:32',
    date: today,
    status: 'taken',
  });

  return logs;
}

export function loadMedications(): Medication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MEDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to load medications:', err);
  }
  saveMedications(INITIAL_MEDICATIONS);
  return INITIAL_MEDICATIONS;
}

export function saveMedications(meds: Medication[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_MEDS, JSON.stringify(meds));
  } catch (err) {
    console.error('Failed to save medications:', err);
  }
}

export function loadIntakeLogs(): IntakeLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to load intake logs:', err);
  }
  const initial = generateInitialLogs();
  saveIntakeLogs(initial);
  return initial;
}

export function saveIntakeLogs(logs: IntakeLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save intake logs:', err);
  }
}

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}
