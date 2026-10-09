/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { TodaySchedule } from './components/TodaySchedule';
import { MedicationList } from './components/MedicationList';
import { HistoryAndAnalytics } from './components/HistoryAndAnalytics';
import { AIAssistant } from './components/AIAssistantModal';
import { SettingsModal } from './components/SettingsModal';
import { AddEditMedModal } from './components/AddEditMedModal';
import { AlarmBanner } from './components/AlarmBanner';
import { Medication, IntakeLog, AppSettings } from './types';
import {
  loadMedications,
  saveMedications,
  loadIntakeLogs,
  saveIntakeLogs,
  loadAppSettings,
  saveAppSettings,
  getTodayDateString,
  DEFAULT_SETTINGS,
} from './utils/storage';
import { logIntakeToGas } from './utils/gasSync';

export default function App() {
  const [medications, setMedications] = useState<Medication[]>(() => loadMedications());
  const [intakeLogs, setIntakeLogs] = useState<IntakeLog[]>(() => loadIntakeLogs());
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());

  const [activeTab, setActiveTab] = useState<'today' | 'meds' | 'history' | 'ai' | 'settings'>('today');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  // Snoozed alarms: medId -> snooze until epoch millis
  const [snoozedUntil, setSnoozedUntil] = useState<Record<string, number>>({});

  // Sync state changes to storage
  useEffect(() => {
    saveMedications(medications);
  }, [medications]);

  useEffect(() => {
    saveIntakeLogs(intakeLogs);
  }, [intakeLogs]);

  useEffect(() => {
    saveAppSettings(settings);
  }, [settings]);

  // Today's logs
  const todayStr = getTodayDateString();
  const todayLogs = useMemo(() => {
    return intakeLogs.filter((l) => l.date === todayStr);
  }, [intakeLogs, todayStr]);

  // Calculate pending and completed counts
  const { pendingCount, completedCount } = useMemo(() => {
    const todayLogMap = new Map<string, IntakeLog>();
    todayLogs.forEach((l) => todayLogMap.set(l.medicationId, l));

    let pending = 0;
    let completed = 0;

    medications.forEach((m) => {
      if (!m.isActive) return;
      const log = todayLogMap.get(m.id);
      if (log?.status === 'taken') {
        completed++;
      } else if (!log || log.status !== 'skipped') {
        pending++;
      }
    });

    return { pendingCount: pending, completedCount: completed };
  }, [medications, todayLogs]);

  // Active alarms monitoring (runs every 5 seconds)
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      const timeNow = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      setCurrentTimeStr(timeNow);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeAlarms = useMemo(() => {
    const nowEpoch = Date.now();
    const takenOrSkippedMedIds = new Set(todayLogs.map((l) => l.medicationId));

    return medications.filter((m) => {
      if (!m.isActive) return false;
      if (takenOrSkippedMedIds.has(m.id)) return false;

      // Check if snoozed
      const snoozed = snoozedUntil[m.id];
      if (snoozed && nowEpoch < snoozed) return false;

      // Check time match: if scheduled time == current time
      return m.time === currentTimeStr;
    });
  }, [medications, todayLogs, snoozedUntil, currentTimeStr]);

  // Actions
  const handleTakeMed = useCallback(
    (med: Medication) => {
      const now = new Date();
      const timeTakenStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const newLog: IntakeLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        medicationId: med.id,
        medicationName: med.name,
        dosage: med.dosage,
        category: med.category,
        scheduledTime: med.time,
        takenTime: timeTakenStr,
        date: todayStr,
        status: 'taken',
        syncedToGas: settings.syncToGas,
      };

      setIntakeLogs((prev) => {
        // remove existing log for today if any, then add new
        const filtered = prev.filter((l) => !(l.medicationId === med.id && l.date === todayStr));
        return [newLog, ...filtered];
      });

      // Decrement stock
      setMedications((prev) =>
        prev.map((m) => (m.id === med.id ? { ...m, stock: Math.max(0, m.stock - 1) } : m))
      );

      // Remove from snooze
      setSnoozedUntil((prev) => {
        const next = { ...prev };
        delete next[med.id];
        return next;
      });

      // Background GAS sync if enabled
      if (settings.syncToGas && settings.gasUrl) {
        logIntakeToGas(settings.gasUrl, {
          name: med.name,
          time: med.time,
          date: todayStr,
          status: '복용 완료',
          memo: med.memo,
        }).catch((err) => console.warn('GAS sync background error:', err));
      }
    },
    [todayStr, settings]
  );

  const handleUndoTake = useCallback(
    (medId: string) => {
      setIntakeLogs((prev) => prev.filter((l) => !(l.medicationId === medId && l.date === todayStr)));
      // restore stock
      setMedications((prev) =>
        prev.map((m) => (m.id === medId ? { ...m, stock: m.stock + 1 } : m))
      );
    },
    [todayStr]
  );

  const handleSkipMed = useCallback(
    (med: Medication) => {
      const newLog: IntakeLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        medicationId: med.id,
        medicationName: med.name,
        dosage: med.dosage,
        category: med.category,
        scheduledTime: med.time,
        takenTime: '',
        date: todayStr,
        status: 'skipped',
        note: '사용자 건너뜀',
      };

      setIntakeLogs((prev) => {
        const filtered = prev.filter((l) => !(l.medicationId === med.id && l.date === todayStr));
        return [newLog, ...filtered];
      });
    },
    [todayStr]
  );

  const handleSnoozeMed = useCallback(
    (medId: string) => {
      const snoozeMinutes = settings.snoozeMinutes || 10;
      const until = Date.now() + snoozeMinutes * 60 * 1000;
      setSnoozedUntil((prev) => ({ ...prev, [medId]: until }));
    },
    [settings.snoozeMinutes]
  );

  const handleSaveMedication = useCallback((medData: Partial<Medication>) => {
    if (medData.id) {
      // Update
      setMedications((prev) =>
        prev.map((m) => (m.id === medData.id ? ({ ...m, ...medData } as Medication) : m))
      );
    } else {
      // Create new
      const newMed: Medication = {
        id: `med-${Date.now()}`,
        name: medData.name || '새 약품',
        time: medData.time || '09:00',
        dosage: medData.dosage || '1정',
        memo: medData.memo || '',
        category: medData.category || 'prescription',
        color: medData.color || 'blue',
        stock: medData.stock ?? 30,
        refillThreshold: medData.refillThreshold ?? 7,
        daysOfWeek: medData.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setMedications((prev) => [...prev, newMed]);
    }
  }, []);

  const handleDeleteMedication = useCallback((medId: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== medId));
  }, []);

  const handleUpdateStock = useCallback((medId: string, newStock: number) => {
    setMedications((prev) => prev.map((m) => (m.id === medId ? { ...m, stock: newStock } : m)));
  }, []);

  const handleToggleActive = useCallback((medId: string) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, isActive: !m.isActive } : m))
    );
  }, []);

  const handleResetData = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  const handleAddParsedMeds = useCallback((parsedList: Partial<Medication>[]) => {
    const newItems: Medication[] = parsedList.map((item, idx) => ({
      id: `med-${Date.now()}-${idx}`,
      name: item.name || '추출된 약품',
      time: item.time || '09:00',
      dosage: item.dosage || '1정',
      memo: item.memo || '',
      category: item.category || 'prescription',
      color: 'blue',
      stock: 30,
      refillThreshold: 7,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      isActive: true,
      createdAt: new Date().toISOString(),
    }));
    setMedications((prev) => [...prev, ...newItems]);
    setActiveTab('meds');
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setEditingMed(null);
          setIsAddModalOpen(true);
        }}
        pendingCount={pendingCount}
        completedCount={completedCount}
        soundEnabled={settings.enableAudio}
        onToggleSound={() =>
          setSettings((prev) => ({ ...prev, enableAudio: !prev.enableAudio }))
        }
        userName={settings.userName}
      />

      {/* Active Alarm Banner (shows when medication time hits) */}
      <AlarmBanner
        activeAlarms={activeAlarms}
        onTakeMed={handleTakeMed}
        onSnoozeMed={handleSnoozeMed}
        onSkipMed={handleSkipMed}
        soundEnabled={settings.enableAudio}
        speechEnabled={settings.enableSpeech}
        userName={settings.userName}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'today' && (
          <TodaySchedule
            medications={medications}
            todayLogs={todayLogs}
            onTakeMed={handleTakeMed}
            onUndoTake={handleUndoTake}
            onSkipMed={handleSkipMed}
            onOpenAddModal={() => {
              setEditingMed(null);
              setIsAddModalOpen(true);
            }}
          />
        )}

        {activeTab === 'meds' && (
          <MedicationList
            medications={medications}
            onOpenAddModal={() => {
              setEditingMed(null);
              setIsAddModalOpen(true);
            }}
            onEditMed={(med) => {
              setEditingMed(med);
              setIsAddModalOpen(true);
            }}
            onDeleteMed={handleDeleteMedication}
            onUpdateStock={handleUpdateStock}
            onToggleActive={handleToggleActive}
          />
        )}

        {activeTab === 'history' && (
          <HistoryAndAnalytics logs={intakeLogs} medications={medications} />
        )}

        {activeTab === 'ai' && (
          <AIAssistant
            medications={medications}
            onAddParsedMeds={handleAddParsedMeds}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={setSettings}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Add / Edit Medication Modal */}
      <AddEditMedModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingMed(null);
        }}
        onSave={handleSaveMedication}
        editingMed={editingMed}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>스마트 약 복용 알림 시스템 (Smart Med Reminder)</span>
          <span className="text-slate-400">
            Google Apps Script & 스프레드시트 연동 지원 · 로컬 스토리지 안전 보관
          </span>
        </div>
      </footer>
    </div>
  );
}
