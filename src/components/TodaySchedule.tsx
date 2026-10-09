import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Pill,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Info,
  CalendarCheck,
  Check,
  XCircle,
  Package,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Medication, IntakeLog } from '../types';
import { playChimeSound } from '../utils/audio';

interface TodayScheduleProps {
  medications: Medication[];
  todayLogs: IntakeLog[];
  onTakeMed: (med: Medication) => void;
  onUndoTake: (medId: string) => void;
  onSkipMed: (med: Medication) => void;
  onOpenAddModal: () => void;
}

export const TodaySchedule: React.FC<TodayScheduleProps> = ({
  medications,
  todayLogs,
  onTakeMed,
  onUndoTake,
  onSkipMed,
  onOpenAddModal,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Map today's logs by medicationId
  const logMap = new Map<string, IntakeLog>();
  todayLogs.forEach((log) => {
    logMap.set(log.medicationId, log);
  });

  // Sort medications chronologically by time
  const sortedMeds = [...medications].sort((a, b) => a.time.localeCompare(b.time));

  // Compute status for each medication
  const currentTimeStr = new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const enrichedMeds = sortedMeds.map((med) => {
    const log = logMap.get(med.id);
    const isTaken = log?.status === 'taken';
    const isSkipped = log?.status === 'skipped';
    const isPast = med.time < currentTimeStr;
    const isOverdue = !isTaken && !isSkipped && isPast;

    return {
      med,
      log,
      isTaken,
      isSkipped,
      isOverdue,
    };
  });

  const totalCount = enrichedMeds.length;
  const completedCount = enrichedMeds.filter((m) => m.isTaken).length;
  const pendingCount = enrichedMeds.filter((m) => !m.isTaken && !m.isSkipped).length;
  const adherenceRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredMeds = enrichedMeds.filter((item) => {
    if (filter === 'completed') return item.isTaken;
    if (filter === 'pending') return !item.isTaken && !item.isSkipped;
    return true;
  });

  const handleTakeWithCelebration = (med: Medication) => {
    onTakeMed(med);
    playChimeSound('success');

    // If completing the last pending medication, fire celebratory confetti!
    if (pendingCount <= 1) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'prescription':
        return '처방약';
      case 'supplement':
        return '영양제';
      case 'chronic':
        return '만성질환약';
      case 'otc':
        return '일반약';
      default:
        return '의약품';
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'emerald':
        return 'border-emerald-500 bg-emerald-50/30 text-emerald-700';
      case 'rose':
        return 'border-rose-500 bg-rose-50/30 text-rose-700';
      case 'amber':
        return 'border-amber-500 bg-amber-50/30 text-amber-700';
      case 'purple':
        return 'border-purple-500 bg-purple-50/30 text-purple-700';
      case 'indigo':
        return 'border-indigo-500 bg-indigo-50/30 text-indigo-700';
      default:
        return 'border-blue-500 bg-blue-50/30 text-blue-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress & Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                오늘의 복약 계획
              </h2>
              {adherenceRate === 100 && totalCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  <Sparkles className="w-3.5 h-3.5" />
                  전체 복용 완료!
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              총 {totalCount}회 복용 일정 중 {completedCount}회를 완료했습니다.
              {pendingCount > 0 && ` (남은 복용: ${pendingCount}회)`}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">
                {adherenceRate}%
              </span>
              <p className="text-[11px] text-slate-400 font-medium">복약 달성률</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              adherenceRate === 100
                ? 'bg-emerald-500'
                : adherenceRate >= 50
                ? 'bg-blue-600'
                : 'bg-amber-500'
            }`}
            style={{ width: `${adherenceRate}%` }}
          />
        </div>

        {/* Filter Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              전체 ({totalCount})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === 'pending'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              복용 대기 ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === 'completed'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              복용 완료 ({completedCount})
            </button>
          </div>

          <button
            onClick={onOpenAddModal}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <span>+ 새 약 추가하기</span>
          </button>
        </div>
      </div>

      {/* Medication List */}
      <div className="space-y-3">
        {filteredMeds.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">
              {filter === 'completed'
                ? '아직 복용 완료된 약이 없습니다.'
                : filter === 'pending'
                ? '오늘 예정된 모든 약을 복용하셨습니다! 건강한 하루 되세요.'
                : '등록된 복약 일정이 없습니다.'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              오른쪽 위의 '새 약 등록' 버튼을 눌러 규칙적인 복용 일정을 등록해보세요.
            </p>
          </div>
        ) : (
          filteredMeds.map(({ med, log, isTaken, isSkipped, isOverdue }) => {
            const colorClass = getColorClasses(med.color);

            return (
              <div
                key={med.id}
                className={`group bg-white rounded-2xl border transition-all duration-200 p-4 sm:p-5 shadow-xs hover:shadow-md ${
                  isTaken
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isOverdue
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
                style={{
                  borderLeftWidth: '5px',
                  borderLeftColor:
                    med.color === 'emerald'
                      ? '#10b981'
                      : med.color === 'rose'
                      ? '#f43f5e'
                      : med.color === 'amber'
                      ? '#f59e0b'
                      : med.color === 'purple'
                      ? '#a855f7'
                      : med.color === 'indigo'
                      ? '#6366f1'
                      : '#2563eb',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      {/* Time */}
                      <span className="font-mono text-xs sm:text-sm font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        {med.time}
                      </span>

                      {/* Category Label */}
                      <span className="text-[11px] text-slate-500 font-medium">
                        {getCategoryLabel(med.category)}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>

                      {/* Dosage */}
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {med.dosage}
                      </span>

                      {/* Overdue alert */}
                      {isOverdue && (
                        <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1 bg-amber-100/80 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          복용 시간 지남
                        </span>
                      )}

                      {/* Low Stock Warning */}
                      {med.stock <= med.refillThreshold && (
                        <span className="text-[11px] text-rose-600 font-medium flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-full">
                          <Package className="w-3 h-3" />
                          잔여 {med.stock}알 (약국 재처방 필요)
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2">
                      <h4
                        className={`text-base sm:text-lg font-bold tracking-tight ${
                          isTaken ? 'text-slate-700 line-through decoration-slate-300' : 'text-slate-900'
                        }`}
                      >
                        {med.name}
                      </h4>
                    </div>

                    {med.memo && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{med.memo}</span>
                      </p>
                    )}
                  </div>

                  {/* Right: Actions & State */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isTaken ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>
                            복용 완료 {log?.takenTime ? `(${log.takenTime})` : ''}
                          </span>
                        </div>
                        <button
                          onClick={() => onUndoTake(med.id)}
                          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="복용 취소"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    ) : isSkipped ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg font-medium">
                          건너뜀
                        </span>
                        <button
                          onClick={() => handleTakeWithCelebration(med)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          복용 완료로 변경
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleTakeWithCelebration(med)}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-xs"
                        >
                          <Check className="w-4 h-4" />
                          <span>복용 완료</span>
                        </button>
                        <button
                          onClick={() => onSkipMed(med)}
                          className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors text-xs font-medium"
                          title="이번 복용 건너뛰기"
                        >
                          건너뛰기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
