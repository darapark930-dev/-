import React, { useEffect, useState } from 'react';
import { Bell, Check, Clock, X, Volume2 } from 'lucide-react';
import { Medication } from '../types';
import { playChimeSound, speakMedicationAlert } from '../utils/audio';

interface AlarmBannerProps {
  activeAlarms: Medication[];
  onTakeMed: (med: Medication) => void;
  onSnoozeMed: (medId: string) => void;
  onSkipMed: (med: Medication) => void;
  soundEnabled: boolean;
  speechEnabled: boolean;
  userName: string;
}

export const AlarmBanner: React.FC<AlarmBannerProps> = ({
  activeAlarms,
  onTakeMed,
  onSnoozeMed,
  onSkipMed,
  soundEnabled,
  speechEnabled,
  userName,
}) => {
  const [playedIds, setPlayedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (activeAlarms.length > 0) {
      activeAlarms.forEach((med) => {
        if (!playedIds.has(med.id)) {
          if (soundEnabled) {
            playChimeSound('alarm');
          }
          if (speechEnabled) {
            speakMedicationAlert(med.name, med.memo, userName);
          }
          setPlayedIds((prev) => new Set(prev).add(med.id));
        }
      });
    }
  }, [activeAlarms, soundEnabled, speechEnabled, userName]);

  if (activeAlarms.length === 0) return null;

  return (
    <div className="bg-amber-500 text-white shadow-md border-b border-amber-600/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600/50 rounded-lg animate-pulse">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base">
                  [복용 시간 알림] {activeAlarms.map((m) => m.name).join(', ')}
                </span>
                <span className="bg-amber-700/60 text-xs px-2 py-0.5 rounded font-mono font-medium">
                  {activeAlarms[0].time}
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                {activeAlarms[0].memo || '정해진 용법에 맞게 지금 복용하세요.'}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {activeAlarms.map((med) => (
              <div key={med.id} className="flex items-center gap-1.5">
                <button
                  onClick={() => onTakeMed(med)}
                  className="flex items-center gap-1 bg-white text-amber-900 hover:bg-amber-100 font-semibold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>복용 완료 ({med.dosage})</span>
                </button>
                <button
                  onClick={() => onSnoozeMed(med.id)}
                  className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                  title="10분 뒤에 다시 알림"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>10분 후</span>
                </button>
                <button
                  onClick={() => onSkipMed(med)}
                  className="p-1.5 text-amber-200 hover:text-white rounded-lg hover:bg-amber-600 transition-colors"
                  title="건너뛰기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
