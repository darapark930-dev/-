export type MedicationCategory = 'prescription' | 'supplement' | 'chronic' | 'otc';

export interface Medication {
  id: string;
  name: string;
  time: string; // HH:mm format (e.g. "08:30")
  dosage: string; // e.g. "1정", "2캡슐", "1포"
  memo: string; // e.g. "식후 30분, 미온수와 함께"
  category: MedicationCategory;
  color: string; // e.g. "blue", "emerald", "amber", "rose", "purple", "indigo"
  stock: number; // remaining pill count
  refillThreshold: number; // alert when stock <= this
  daysOfWeek: number[]; // 0=Sun, 1=Mon ... 6=Sat, empty or [0,1,2,3,4,5,6] means everyday
  isActive: boolean;
  createdAt: string;
}

export type IntakeStatus = 'taken' | 'skipped' | 'snoozed';

export interface IntakeLog {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  category: MedicationCategory;
  scheduledTime: string;
  takenTime: string; // ISO string or HH:mm
  date: string; // YYYY-MM-DD
  status: IntakeStatus;
  note?: string;
  syncedToGas?: boolean;
}

export interface AppSettings {
  userName: string;
  enableAudio: boolean;
  enableSpeech: boolean;
  enableDesktopNotification: boolean;
  gasUrl: string;
  syncToGas: boolean;
  snoozeMinutes: number;
}
