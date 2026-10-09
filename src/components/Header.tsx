import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Volume2,
  VolumeX,
  Sparkles,
  Calendar,
  Pill,
  BarChart3,
  Settings,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { playChimeSound } from '../utils/audio';

interface HeaderProps {
  activeTab: 'today' | 'meds' | 'history' | 'ai' | 'settings';
  setActiveTab: (tab: 'today' | 'meds' | 'history' | 'ai' | 'settings') => void;
  onOpenAddModal: () => void;
  pendingCount: number;
  completedCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  userName: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  pendingCount,
  completedCount,
  soundEnabled,
  onToggleSound,
  userName,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (d: Date) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const date = d.getDate();
    const day = days[d.getDay()];
    return `${y}년 ${m}월 ${date}일 (${day})`;
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const totalToday = pendingCount + completedCount;
  const adherenceRate = totalToday > 0 ? Math.round((completedCount / totalToday) * 100) : 0;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Live Clock */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                스마트 약 복용 알림
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                스마트 케어
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>{formatDate(currentTime)}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-medium text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                {formatTime(currentTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Health Summary & Fast Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Today Adherence Rate */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs">
            <div className="flex flex-col">
              <span className="text-slate-500 text-[11px]">오늘 복약 현황</span>
              <span className="font-semibold text-slate-800">
                {completedCount}/{totalToday} 완료 ({adherenceRate}%)
              </span>
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center relative">
              <span className="text-[10px] font-bold text-blue-600">
                {adherenceRate}%
              </span>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              if (!soundEnabled) {
                playChimeSound('alarm');
              }
              onToggleSound();
            }}
            title={soundEnabled ? '알림 소리 켜짐 (클릭시 음소거)' : '알림 소리 꺼짐 (클릭시 켜기)'}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Add Med Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>새 약 등록</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-100 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'today'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>오늘 복용 일정</span>
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 text-amber-800 font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('meds')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'meds'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>등록된 약 관리</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>복약 기록 & 통계</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'ai'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>스마트 복약 AI</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>설정 & 구글 연동</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
